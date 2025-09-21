import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateTextCommandDto } from './dto/create-text-command.dto';
import { UpdateTextCommandDto } from './dto/update-text-command.dto';
import { QueryTextCommandDto } from './dto/query-text-command.dto';
import {
  calculateExpiryDate,
  resolveExpiryStatus,
  ExpiryStatus,
} from '../../common/utils/date.util';
import { Prisma } from '@prisma/client';
import { BulkDeleteTextCommandDto } from './dto/bulk-delete-text-command.dto';

@Injectable()
export class TextCommandsService {
  // 文字口令的增删改查都集中在这里
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTextCommandDto) {
    const { subProjectId, status } = query;

    return (await this.prisma.textCommand.findMany({
      where: {
        isActive: true,
        ...(subProjectId ? { subProjectId } : {}),
        ...this.buildStatusWhere(status),
      },
      include: { subProject: true },
      orderBy: { createdAt: 'desc' },
    })).map((command) => this.mapCommand(command));
  }

  async findOne(id: number) {
    const command = await this.prisma.textCommand.findFirst({
      where: { id, isActive: true },
      include: { subProject: true },
    });

    if (!command) {
      throw new NotFoundException('文字口令不存在');
    }

    return this.mapCommand(command);
  }

  async create(dto: CreateTextCommandDto) {
    // 创建前确认子项目是否存在
    await this.ensureSubProjectExists(dto.subProjectId);

    return this.prisma.textCommand
      .create({
        data: {
          subProject: { connect: { id: dto.subProjectId } },
          commandText: dto.commandText,
          expiryDays: dto.expiryDays,
          expiryDate: calculateExpiryDate(dto.expiryDays) ?? undefined,
        },
        include: { subProject: true },
      })
      .then((command) => this.mapCommand(command));
  }

  async update(id: number, dto: UpdateTextCommandDto) {
    const command = await this.ensureExists(id);

    const nextExpiryDays = dto.expiryDays ?? command.expiryDays;
    if (nextExpiryDays === null || nextExpiryDays === undefined) {
      throw new BadRequestException('文字口令必须设置有效天数');
    }

    return this.prisma.textCommand
      .update({
        where: { id: command.id },
        data: {
          commandText: dto.commandText ?? command.commandText,
          expiryDays: nextExpiryDays,
          expiryDate: calculateExpiryDate(nextExpiryDays) ?? undefined,
        },
        include: { subProject: true },
      })
      .then((updated) => this.mapCommand(updated));
  }

  async remove(id: number) {
    await this.ensureExists(id);

    // 软删除，避免直接清空历史数据
    await this.prisma.textCommand.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '文字口令删除成功' };
  }

  async bulkRemoveExpired(dto: BulkDeleteTextCommandDto) {
    const commands = await this.prisma.textCommand.findMany({
      where: {
        id: { in: dto.ids },
        isActive: true,
      },
    });

    if (commands.length === 0) {
      return { message: '未找到待删除的文字口令', removed: 0, skipped: 0 };
    }

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const expiredIds = commands
      .filter((command) =>
        command.expiryDate ? command.expiryDate.getTime() < startOfToday.getTime() : false,
      )
      .map((command) => command.id);

    const skipped = commands.length - expiredIds.length;

    if (expiredIds.length === 0) {
      return {
        message: '选中的文字口令尚未过期',
        removed: 0,
        skipped,
      };
    }

    await this.prisma.textCommand.updateMany({
      where: { id: { in: expiredIds } },
      data: { isActive: false },
    });

    return {
      message: '过期文字口令已批量删除',
      removed: expiredIds.length,
      skipped,
    };
  }

  private async ensureExists(id: number) {
    const command = await this.prisma.textCommand.findFirst({
      where: { id, isActive: true },
    });

    if (!command) {
      throw new NotFoundException('文字口令不存在');
    }

    return command;
  }

  private async ensureSubProjectExists(subProjectId: number) {
    const subProject = await this.prisma.subProject.findFirst({
      where: { id: subProjectId, isActive: true },
    });

    if (!subProject) {
      throw new NotFoundException('子项目不存在');
    }
  }

  private buildStatusWhere(status?: ExpiryStatus): Prisma.TextCommandWhereInput {
    if (!status) {
      return {};
    }

    // 与内容一致，通过有效期分三种状态
    const today = new Date();
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const addDays = (days: number) => {
      const base = new Date(startOfToday);
      base.setUTCDate(base.getUTCDate() + days);
      return base;
    };

    const expiryDate: Prisma.DateTimeNullableFilter = { not: null };

    switch (status) {
      case 'safe':
        expiryDate.gt = addDays(7);
        break;
      case 'warning':
        expiryDate.gte = addDays(3);
        expiryDate.lte = addDays(7);
        break;
      case 'danger':
        expiryDate.lt = addDays(3);
        break;
    }

    return { expiryDate };
  }

  private mapCommand(command: any) {
    // 统一输出结构并附加有效期状态
    const meta = resolveExpiryStatus(command.expiryDate);
    return {
      id: command.id,
      subProjectId: command.subProjectId,
      commandText: command.commandText,
      expiryDays: command.expiryDays ?? null,
      expiryDate: command.expiryDate,
      createdAt: command.createdAt,
      updatedAt: command.updatedAt,
      subProject: command.subProject
        ? { id: command.subProject.id, name: command.subProject.name }
        : undefined,
      expiryStatus: meta?.status ?? null,
      daysRemaining: meta?.daysRemaining ?? null,
    };
  }
}
