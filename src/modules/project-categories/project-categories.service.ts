import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
import { QueryProjectCategoryDto } from './dto/query-project-category.dto';

@Injectable()
export class ProjectCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProjectCategoryDto) {
    const { includeInactive } = query;

    const categories = await this.prisma.projectCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        projects: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return categories.map((category) => this.mapCategory(category));
  }

  async findOne(id: number) {
    const category = await this.prisma.projectCategory.findFirst({
      where: { id },
      include: {
        projects: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('项目分类不存在');
    }

    return this.mapCategory(category);
  }

  async create(dto: CreateProjectCategoryDto) {
    const category = await this.prisma.projectCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        projects: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return this.mapCategory(category);
  }

  async update(id: number, dto: UpdateProjectCategoryDto) {
    await this.ensureExists(id);

    const category = await this.prisma.projectCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        projects: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return this.mapCategory(category);
  }

  async remove(id: number) {
    await this.ensureExists(id);

    const activeProjectCount = await this.prisma.project.count({
      where: { categoryId: id, isActive: true },
    });

    if (activeProjectCount > 0) {
      throw new BadRequestException('分类下仍有有效项目，无法删除');
    }

    await this.prisma.projectCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '项目分类删除成功' };
  }

  private async ensureExists(id: number) {
    const category = await this.prisma.projectCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('项目分类不存在');
    }
  }

  private mapCategory(category: any) {
    return {
      id: category.id,
      name: category.name,
      description: category.description ?? null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      activeProjectCount: category.projects?.length ?? 0,
    };
  }
}
