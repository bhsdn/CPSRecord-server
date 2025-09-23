import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';

@Injectable()
export class ContentTypesService {
  // 内容类型的增删改查逻辑
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // 直接返回全部类型，前端可用于下拉选择
    return this.prisma.contentType.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateContentTypeDto) {
    // 创建前校验名称是否重复
    const existing = await this.prisma.contentType.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('内容类型名称已存在');
    }

    return this.prisma.contentType.create({ data: dto });
  }

  async update(id: number, dto: UpdateContentTypeDto) {
    const type = await this.ensureExists(id);

    if (type.isSystem && dto.name && dto.name !== type.name) {
      throw new BadRequestException('系统内置类型名称不可修改');
    }

    if (dto.name && dto.name !== type.name) {
      // 普通类型也需要保证名称唯一
      const exists = await this.prisma.contentType.findUnique({
        where: { name: dto.name },
      });
      if (exists) {
        throw new BadRequestException('内容类型名称已存在');
      }
    }

    return this.prisma.contentType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const type = await this.ensureExists(id);

    if (type.isSystem) {
      throw new BadRequestException('系统内置类型不可删除');
    }

    const usage = await this.prisma.subProjectContent.count({
      where: { contentTypeId: id, isActive: true },
    });

    if (usage > 0) {
      throw new BadRequestException('内容类型被内容使用，无法删除');
    }

    await this.prisma.contentType.delete({ where: { id } });
    return { message: '内容类型删除成功' };
  }

  private async ensureExists(id: number) {
    // 共用校验，避免操作不存在的类型
    const type = await this.prisma.contentType.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException('内容类型不存在');
    }
    return type;
  }
}
