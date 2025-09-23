import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import {
  calculateExpiryDate,
  resolveExpiryStatus,
  ExpiryStatus,
} from '../../common/utils/date.util';
import { isURL } from 'class-validator';
import { BatchOperations } from '../../common/utils/batch.util';

@Injectable()
export class ContentsService {
  // 所有内容相关的数据库操作都放在这里
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryContentDto) {
    const { subProjectId, status } = query;

    return (await this.prisma.subProjectContent.findMany({
      where: {
        isActive: true,
        ...(subProjectId ? { subProjectId } : {}),
        ...this.buildStatusWhere(status),
      },
      include: { contentType: true, subProject: true },
      orderBy: { createdAt: 'desc' },
    })).map((content: any) => this.mapContent(content));
  }

  async findOne(id: number) {
    const content = await this.prisma.subProjectContent.findFirst({
      where: { id, isActive: true },
      include: { contentType: true, subProject: true },
    });

    if (!content) {
      throw new NotFoundException('子项目内容不存在');
    }

    return this.mapContent(content);
  }

  async create(dto: CreateContentDto) {
    // 创建前需要校验子项目与内容类型是否存在
    await this.ensureSubProjectExists(dto.subProjectId);
    const contentType = await this.ensureContentTypeExists(dto.contentTypeId);

    // 同一个子项目只能有一种内容类型，避免重复
    const existing = await this.prisma.subProjectContent.findFirst({
      where: {
        subProjectId: dto.subProjectId,
        contentTypeId: dto.contentTypeId,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException('该子项目已存在相同类型的内容');
    }

    // 根据内容类型的配置校验有效期和内容值
    this.assertExpiryRule(contentType.hasExpiry, dto.expiryDays);
    this.assertContentValue(contentType.fieldType, dto.contentValue);

    return this.prisma.subProjectContent.create({
      data: {
        subProject: { connect: { id: dto.subProjectId } },
        contentType: { connect: { id: dto.contentTypeId } },
        contentValue: dto.contentValue,
        expiryDays: contentType.hasExpiry ? dto.expiryDays : null,
        expiryDate: contentType.hasExpiry
          ? calculateExpiryDate(dto.expiryDays) ?? undefined
          : null,
      },
      include: { contentType: true, subProject: true },
    }).then((content: any) => this.mapContent(content));
  }

  async update(id: number, dto: UpdateContentDto) {
    const content = await this.ensureExists(id);

    let contentType = content.contentType;

    if (dto.contentTypeId && dto.contentTypeId !== content.contentTypeId) {
      // 切换内容类型时需要重新校验是否重复
      contentType = await this.ensureContentTypeExists(dto.contentTypeId);
      const duplicate = await this.prisma.subProjectContent.findFirst({
        where: {
          subProjectId: content.subProjectId,
          contentTypeId: dto.contentTypeId,
          isActive: true,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new BadRequestException('该子项目已存在相同类型的内容');
      }
    }

    if (dto.contentValue) {
      // 更新内容值时也需要按类型做校验
      this.assertContentValue(contentType.fieldType, dto.contentValue);
    }

    const nextExpiryDays = this.resolveExpiryDays(
      contentType.hasExpiry,
      dto.expiryDays,
      dto.contentTypeId ? undefined : content.expiryDays,
    );

    return this.prisma.subProjectContent
      .update({
        where: { id },
        data: {
          contentTypeId: dto.contentTypeId,
          contentValue: dto.contentValue,
          expiryDays: contentType.hasExpiry ? nextExpiryDays : null,
          expiryDate: contentType.hasExpiry
            ? calculateExpiryDate(nextExpiryDays) ?? undefined
            : null,
        },
        include: { contentType: true, subProject: true },
      })
      .then((updated: any) => this.mapContent(updated));
  }

  async remove(id: number) {
    await this.ensureExists(id);

    // 软删除，保留历史记录
    await this.prisma.subProjectContent.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '子项目内容删除成功' };
  }

  async refreshExpiryMetadata() {
    await BatchOperations.batchUpdateExpiryStatus(this.prisma);
    return { message: '内容到期状态刷新成功' };
  }

  private async ensureExists(id: number) {
    // 共用的存在性校验，返回带内容类型的对象
    const content = await this.prisma.subProjectContent.findFirst({
      where: { id, isActive: true },
      include: { contentType: true, subProject: true },
    });
    if (!content) {
      throw new NotFoundException('子项目内容不存在');
    }
    return content;
  }

  private async ensureSubProjectExists(subProjectId: number) {
    const subProject = await this.prisma.subProject.findFirst({
      where: { id: subProjectId, isActive: true },
    });
    if (!subProject) {
      throw new NotFoundException('子项目不存在');
    }
  }

  private async ensureContentTypeExists(contentTypeId: number) {
    const contentType = await this.prisma.contentType.findUnique({
      where: { id: contentTypeId },
    });
    if (!contentType) {
      throw new NotFoundException('内容类型不存在');
    }
    return contentType;
  }

  private assertExpiryRule(hasExpiry: boolean, expiryDays?: number) {
    // 不同类型的内容对有效期有强制要求
    if (hasExpiry && (expiryDays === undefined || expiryDays === null)) {
      throw new BadRequestException('该内容类型需要设置有效天数');
    }

    if (!hasExpiry && expiryDays !== undefined) {
      throw new BadRequestException('该内容类型无需设置有效天数');
    }
  }

  private assertContentValue(fieldType: string, value: string) {
    if (!value) {
      throw new BadRequestException('内容值不能为空');
    }

    if (['url', 'image'].includes(fieldType) && !isURL(value)) {
      throw new BadRequestException('内容值必须是合法的链接地址');
    }

    if (fieldType === 'number' && Number.isNaN(Number(value))) {
      throw new BadRequestException('内容值必须是数值');
    }

    if (fieldType === 'date' && Number.isNaN(Date.parse(value))) {
      throw new BadRequestException('内容值必须是合法的日期');
    }
  }

  private resolveExpiryDays(
    hasExpiry: boolean,
    incoming?: number,
    fallback?: number | null,
  ) {
    if (!hasExpiry) {
      return null;
    }

    const resolved = incoming ?? fallback;
    if (resolved === null || resolved === undefined) {
      throw new BadRequestException('该内容类型需要设置有效天数');
    }
    return resolved;
  }

  private buildStatusWhere(status?: ExpiryStatus): Record<string, unknown> {
    if (!status) {
      return {};
    }

    // 通过状态过滤不同有效期范围的数据
    const today = new Date();
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const addDays = (days: number) => {
      const base = new Date(startOfToday);
      base.setUTCDate(base.getUTCDate() + days);
      return base;
    };

    const expiryDate: Record<string, unknown> = { not: null };

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

  private mapContent(content: any) {
    // 将数据库字段转换成前端友好的结构，并附带有效期状态
    const meta = resolveExpiryStatus(content.expiryDate);
    return {
      id: content.id,
      subProjectId: content.subProjectId,
      contentTypeId: content.contentTypeId,
      contentValue: content.contentValue,
      expiryDays: content.expiryDays ?? null,
      expiryDate: content.expiryDate,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      contentType: content.contentType,
      subProject: content.subProject
        ? {
            id: content.subProject.id,
            name: content.subProject.name,
          }
        : undefined,
      expiryStatus: meta?.status ?? null,
      daysRemaining: meta?.daysRemaining ?? null,
    };
  }
}
