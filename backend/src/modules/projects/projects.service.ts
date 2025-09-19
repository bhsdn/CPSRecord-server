import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { buildPaginationResponse } from '../../common/utils/response.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProjectDto) {
    const { page = 1, limit = 10, search } = query;

    const where: Prisma.ProjectWhereInput = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { subProjects: { where: { isActive: true } } } },
        },
      }),
    ]);

    return buildPaginationResponse(items, total, page, limit);
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, isActive: true },
      include: {
        subProjects: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({ data: createProjectDto });
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    await this.ensureExists(id);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

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

    return this.prisma.subProject.findMany({
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
      },
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.project.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('项目不存在');
    }
  }
}
