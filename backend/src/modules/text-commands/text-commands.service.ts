import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateTextCommandDto } from './dto/create-text-command.dto';
import { UpdateTextCommandDto } from './dto/update-text-command.dto';
import { QueryTextCommandDto } from './dto/query-text-command.dto';
import { calculateExpiryDate } from '../../common/utils/date.util';

@Injectable()
export class TextCommandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTextCommandDto) {
    const { subProjectId } = query;

    return this.prisma.textCommand.findMany({
      where: {
        isActive: true,
        ...(subProjectId ? { subProjectId } : {}),
      },
      include: { subProject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const command = await this.prisma.textCommand.findFirst({
      where: { id, isActive: true },
      include: { subProject: true },
    });

    if (!command) {
      throw new NotFoundException('文字口令不存在');
    }

    return command;
  }

  async create(dto: CreateTextCommandDto) {
    await this.ensureSubProjectExists(dto.subProjectId);

    return this.prisma.textCommand.create({
      data: {
        subProject: { connect: { id: dto.subProjectId } },
        commandText: dto.commandText,
        expiryDays: dto.expiryDays,
        expiryDate: calculateExpiryDate(dto.expiryDays) ?? undefined,
      },
      include: { subProject: true },
    });
  }

  async update(id: number, dto: UpdateTextCommandDto) {
    const command = await this.ensureExists(id);

    return this.prisma.textCommand.update({
      where: { id: command.id },
      data: {
        commandText: dto.commandText ?? command.commandText,
        expiryDays: dto.expiryDays ?? command.expiryDays,
        expiryDate:
          dto.expiryDays !== undefined
            ? calculateExpiryDate(dto.expiryDays) ?? undefined
            : command.expiryDate,
      },
      include: { subProject: true },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.textCommand.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '文字口令删除成功' };
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
}
