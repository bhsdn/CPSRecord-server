import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { buildPaginationResponse } from '../../common/utils/response.util';
import { Prisma } from '@prisma/client';
import { resolveExpiryStatus } from '../../common/utils/date.util';

@Injectable()
export class ProjectsService {
  // 依赖 PrismaService 来完成数据库操作
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProjectDto) {
    const { page = 1, limit = 10, search, categoryId } = query;

    // 组合分页 + 搜索条件，仅返回未删除的项目
    const where: Prisma.ProjectWhereInput = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // 使用事务同时拿到总数和分页列表，避免两次请求数据不一致
    const [total, items] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          subProjects: {
            where: { isActive: true },
            select: { id: true, documentationEnabled: true },
          },
        },
      }),
    ]);

    // 返回给前端的字段做了一层整理，避免暴露无用信息
    const projects = items.map((project) => ({
      id: project.id,
      categoryId: project.categoryId,
      category: this.mapCategory(project.category),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      subProjectCount: project.subProjects.length,
      documentationEnabledCount: project.subProjects.filter(
        (item) => item.documentationEnabled,
      ).length,
    }));

    return buildPaginationResponse(projects, total, page, limit);
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, isActive: true },
      include: {
        category: true,
        subProjects: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            project: { include: { category: true } },
            contents: {
              where: { isActive: true },
              include: { contentType: true },
            },
            textCommands: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 聚合子项目、内容、口令等信息，方便前端一次性渲染
    return {
      id: project.id,
      categoryId: project.categoryId,
      category: this.mapCategory(project.category),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      subProjects: project.subProjects.map((subProject) =>
        this.mapSubProject(subProject),
      ),
    };
  }

  async create(createProjectDto: CreateProjectDto) {
    await this.ensureCategoryExists(createProjectDto.categoryId);

    const { categoryId, ...rest } = createProjectDto;
    const project = await this.prisma.project.create({
      data: {
        ...rest,
        category: { connect: { id: categoryId } },
      },
      include: { category: true },
    });

    return {
      id: project.id,
      categoryId: project.categoryId,
      category: this.mapCategory(project.category),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    await this.ensureExists(id);

    if (updateProjectDto.categoryId !== undefined) {
      await this.ensureCategoryExists(updateProjectDto.categoryId);
    }

    const { categoryId, ...rest } = updateProjectDto;

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryId !== undefined
          ? { category: { connect: { id: categoryId } } }
          : {}),
      },
      include: { category: true },
    });

    return {
      id: project.id,
      categoryId: project.categoryId,
      category: this.mapCategory(project.category),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async remove(id: number) {
    await this.ensureExists(id);

    // 项目删除时同时软删除关联的子项目/内容/口令
    await this.prisma.$transaction([
      this.prisma.subProjectContent.updateMany({
        where: { subProject: { projectId: id } },
        data: { isActive: false },
      }),
      this.prisma.textCommand.updateMany({
        where: { subProject: { projectId: id } },
        data: { isActive: false },
      }),
      this.prisma.subProject.updateMany({
        where: { projectId: id },
        data: { isActive: false },
      }),
      this.prisma.project.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return { message: '项目删除成功' };
  }

  async getSubProjects(projectId: number) {
    await this.ensureExists(projectId);

    const subProjects = await this.prisma.subProject.findMany({
      where: { projectId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        contents: {
          where: { isActive: true },
          include: { contentType: true },
        },
        textCommands: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        project: { include: { category: true } },
      },
    });

    return subProjects.map((subProject) => this.mapSubProject(subProject));
  }

  private async ensureExists(id: number) {
    // 公共校验方法：判断项目是否存在且未删除
    const exists = await this.prisma.project.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('项目不存在');
    }
  }

  private mapSubProject(subProject: any) {
    // 子项目下的内容会附带有效期状态，前端直接渲染标签即可
    const contents = subProject.contents?.map((content: any) => {
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
        expiryStatus: meta?.status ?? null,
        daysRemaining: meta?.daysRemaining ?? null,
      };
    });

    const textCommands = subProject.textCommands?.map((command: any) => {
      const meta = resolveExpiryStatus(command.expiryDate);
      return {
        id: command.id,
        subProjectId: command.subProjectId,
        commandText: command.commandText,
        expiryDays: command.expiryDays ?? null,
        expiryDate: command.expiryDate,
        createdAt: command.createdAt,
        updatedAt: command.updatedAt,
        expiryStatus: meta?.status ?? null,
        daysRemaining: meta?.daysRemaining ?? null,
      };
    });

    return {
      id: subProject.id,
      projectId: subProject.projectId,
      name: subProject.name,
      description: subProject.description,
      sortOrder: subProject.sortOrder,
      createdAt: subProject.createdAt,
      updatedAt: subProject.updatedAt,
      documentationEnabled: subProject.documentationEnabled,
      project: subProject.project
        ? {
            id: subProject.project.id,
            name: subProject.project.name,
            category:
              this.mapCategory(subProject.project.category) ?? undefined,
          }
        : undefined,
      contentCount: contents?.length ?? 0,
      textCommandCount: textCommands?.length ?? 0,
      contents,
      textCommands,
    };
  }

  private mapCategory(category?: any) {
    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description ?? null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }

  private async ensureCategoryExists(categoryId: number) {
    const exists = await this.prisma.projectCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('项目分类不存在或已停用');
    }
  }
}
