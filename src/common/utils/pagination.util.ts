import { PrismaService } from '../database/prisma.service';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedPayload<T> {
  data: T[];
  pagination: PaginationMeta;
}

export class PaginationHelper {
  static async paginate<T>(
    prisma: PrismaService,
    model: keyof PrismaService,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      page: number;
      limit: number;
    },
  ): Promise<PaginatedPayload<T>> {
    const { page, limit, where, include, orderBy } = options;
    const skip = (page - 1) * limit;
    const repository = (prisma as any)[model];

    if (!repository?.findMany || !repository?.count) {
      throw new Error(`Model ${String(model)} is not queryable`);
    }

    const [data, total] = await Promise.all([
      repository.findMany({ where, include, orderBy, skip, take: limit }),
      repository.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page * limit < total;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }
}
