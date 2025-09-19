import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { calculateExpiryDate } from '../../common/utils/date.util';

@Injectable()
export class ContentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryContentDto) {
    const { subProjectId } = query;

    return this.prisma.subProjectContent.findMany({
      where: {
        isActive: true,
        ...(subProjectId ? { subProjectId } : {}),
      },
      include: { contentType: true, subProject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const content = await this.prisma.subProjectContent.findFirst({
      where: { id, isActive: true },
      include: { contentType: true, subProject: true },
    });

    if (!content) {
      throw new NotFoundException('子项目内容不存在');
    }

    return content;
  }

  async create(dto: CreateContentDto) {
    await this.ensureSubProjectExists(dto.subProjectId);
    await this.ensureContentTypeExists(dto.contentTypeId);

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

    return this.prisma.subProjectContent.create({
      data: {
        subProject: { connect: { id: dto.subProjectId } },
        contentType: { connect: { id: dto.contentTypeId } },
        contentValue: dto.contentValue,
        expiryDays: dto.expiryDays,
        expiryDate: calculateExpiryDate(dto.expiryDays) ?? undefined,
      },
      include: { contentType: true, subProject: true },
    });
  }

  async update(id: number, dto: UpdateContentDto) {
    const content = await this.ensureExists(id);

    if (dto.contentTypeId && dto.contentTypeId !== content.contentTypeId) {
      await this.ensureContentTypeExists(dto.contentTypeId);
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

    return this.prisma.subProjectContent.update({
      where: { id },
      data: {
        contentTypeId: dto.contentTypeId,
        contentValue: dto.contentValue,
        expiryDays: dto.expiryDays ?? content.expiryDays,
        expiryDate:
          dto.expiryDays !== undefined
            ? calculateExpiryDate(dto.expiryDays) ?? undefined
            : content.expiryDate,
      },
      include: { contentType: true, subProject: true },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.subProjectContent.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '子项目内容删除成功' };
  }

  private async ensureExists(id: number) {
    const content = await this.prisma.subProjectContent.findFirst({
      where: { id, isActive: true },
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
  }
}
