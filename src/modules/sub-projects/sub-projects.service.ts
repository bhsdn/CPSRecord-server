import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSubProjectDto } from './dto/create-sub-project.dto';
import { UpdateSubProjectDto } from './dto/update-sub-project.dto';
import { QuerySubProjectDto } from './dto/query-sub-project.dto';
import { ReorderSubProjectDto } from './dto/reorder-sub-project.dto';
import { Prisma } from '@prisma/client';
import { resolveExpiryStatus } from '../../common/utils/date.util';

@Injectable()
export class SubProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySubProjectDto) {
    const { projectId, search } = query;

    const where: Prisma.SubProjectWhereInput = {
      isActive: true,
      ...(projectId ? { projectId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const subProjects = await this.prisma.subProject.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        project: true,
        contents: { where: { isActive: true }, include: { contentType: true } },
        textCommands: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    return subProjects.map((subProject) => this.mapSubProject(subProject));
  }

  async findOne(id: number) {
    const subProject = await this.prisma.subProject.findFirst({
      where: { id, isActive: true },
      include: {
        project: true,
        contents: { where: { isActive: true }, include: { contentType: true } },
        textCommands: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!subProject) {
      throw new NotFoundException('子项目不存在');
    }

    return this.mapSubProject(subProject);
  }

  async create(dto: CreateSubProjectDto) {
    await this.ensureProjectExists(dto.projectId);

    const { projectId, sortOrder, ...rest } = dto;
    const subProject = await this.prisma.subProject.create({
      data: {
        ...rest,
        project: { connect: { id: projectId } },
        sortOrder: sortOrder ?? (await this.getNextSortOrder(projectId)),
      },
    });

    return this.findOne(subProject.id);
  }

  async update(id: number, dto: UpdateSubProjectDto) {
    const subProject = await this.ensureExists(id);

    await this.prisma.subProject.update({
      where: { id: subProject.id },
      data: {
        name: dto.name ?? subProject.name,
        description: dto.description ?? subProject.description,
        sortOrder: dto.sortOrder ?? subProject.sortOrder,
      },
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.$transaction([
      this.prisma.subProjectContent.updateMany({
        where: { subProjectId: id },
        data: { isActive: false },
      }),
      this.prisma.textCommand.updateMany({
        where: { subProjectId: id },
        data: { isActive: false },
      }),
      this.prisma.subProject.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return { message: '子项目删除成功' };
  }

  async reorder(dto: ReorderSubProjectDto) {
    const updates = dto.items.map((item) =>
      this.prisma.subProject.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);
    return { message: '子项目排序更新成功' };
  }

  private async ensureExists(id: number) {
    const subProject = await this.prisma.subProject.findFirst({
      where: { id, isActive: true },
    });

    if (!subProject) {
      throw new NotFoundException('子项目不存在');
    }

    return subProject;
  }

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, isActive: true },
    });

    if (!project) {
      throw new NotFoundException('所属项目不存在');
    }
  }

  private async getNextSortOrder(projectId: number) {
    const latest = await this.prisma.subProject.findFirst({
      where: { projectId, isActive: true },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return (latest?.sortOrder ?? 0) + 1;
  }

  private mapSubProject(subProject: any) {
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
      project: subProject.project
        ? { id: subProject.project.id, name: subProject.project.name }
        : undefined,
      contentCount: contents?.length ?? 0,
      textCommandCount: textCommands?.length ?? 0,
      contents,
      textCommands,
    };
  }
}
