import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { resolveExpiryStatus } from '../../common/utils/date.util';
import { buildPaginationResponse } from '../../common/utils/response.util';
import { QueryDocumentationDto } from './dto/query-documentation.dto';

@Injectable()
export class DocumentationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryDocumentationDto) {
    const { page = 1, limit = 10, categoryId, projectId, search } = query;

    const where: Prisma.SubProjectWhereInput = {
      isActive: true,
      documentationEnabled: true,
      ...(projectId ? { projectId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      project: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
      },
    };

    // 使用事务同时获取总数和分页数据，确保数据一致性
    const [total, subProjects] = await this.prisma.$transaction([
      this.prisma.subProject.count({ where }),
      this.prisma.subProject.findMany({
        where,
        orderBy: [{ projectId: 'asc' }, { sortOrder: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
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
      }),
    ]);

    const documents = subProjects.map((subProject) =>
      this.mapDocumentation(subProject),
    );

    return buildPaginationResponse(documents, total, page, limit);
  }

  private mapDocumentation(subProject: any) {
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

    const snapshot = contents?.reduce(
      (acc: Record<string, unknown>, item: any) => {
        if (item.contentType?.name) {
          acc[item.contentType.name] = item.contentValue;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return {
      id: subProject.id,
      projectId: subProject.projectId,
      name: subProject.name,
      description: subProject.description,
      sortOrder: subProject.sortOrder,
      documentationEnabled: subProject.documentationEnabled,
      project: subProject.project
        ? {
            id: subProject.project.id,
            name: subProject.project.name,
            category: subProject.project.category
              ? {
                  id: subProject.project.category.id,
                  name: subProject.project.category.name,
                  description: subProject.project.category.description ?? null,
                  sortOrder: subProject.project.category.sortOrder,
                  isActive: subProject.project.category.isActive,
                }
              : null,
          }
        : null,
      contents,
      textCommands,
      snapshot: snapshot ?? {},
    };
  }
}
