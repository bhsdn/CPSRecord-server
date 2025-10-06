/*
 * @Descripttion: js
 * @Version: 1.0
 * @Author: name
 * @Date: 2025-10-05 23:47:47
 * @LastEditors: name
 * @LastEditTime: 2025-10-06 01:40:11
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateUploadedImageDto } from './dto/create-uploaded-image.dto';
import { QueryUploadedImageDto } from './dto/query-uploaded-image.dto';
import { buildPaginationResponse } from '../../common/utils/response.util';
import { Prisma } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class UploadedImagesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly PICUI_API_URL = process.env.PICUI_API_URL || 'https://picui.cn/api/v1';
  private readonly PICUI_TOKEN = process.env.PICUI_TOKEN || '';

  /**
   * 调用 PICUI API 删除图片（私有方法）
   * @param key 图片的唯一标识
   */
  private async deletePicuiImage(key: string): Promise<void> {
    if (!this.PICUI_TOKEN) {
      console.warn('PICUI_TOKEN 未配置，跳过远程删除');
      return;
    }

    const deleteUrl = `${this.PICUI_API_URL}/images/${key}`;
    await axios.delete(deleteUrl, {
      headers: {
        Authorization: `Bearer ${this.PICUI_TOKEN}`,
        Accept: 'application/json',
      },
    });
  }

  /**
   * 保存上传的图片信息到数据库
   * 如果检测到重复（相同 MD5），则删除新上传的图片并返回已存在的记录
   */
  async create(createDto: CreateUploadedImageDto) {
    // 检查是否已存在相同 MD5 的图片（去重）
    const existing = await this.prisma.uploadedImage.findFirst({
      where: { md5: createDto.md5, isActive: true },
    });

    if (existing) {
      // 如果已存在，删除新上传的重复图片
      try {
        await this.deletePicuiImage(createDto.key);
        console.log(`已删除重复图片: ${createDto.key} (MD5: ${createDto.md5})`);
      } catch (error) {
        console.error('删除重复图片失败:', error);
        // 即使删除失败也继续，不影响返回已存在的记录
      }

      // 返回现有记录
      return {
        ...existing,
        isDuplicate: true, // 标记为重复
        duplicateKey: createDto.key, // 记录被删除的图片 key
      };
    }

    // 创建新记录
    return await this.prisma.uploadedImage.create({
      data: {
        key: createDto.key,
        name: createDto.name,
        pathname: createDto.pathname,
        originName: createDto.originName,
        size: createDto.size,
        width: createDto.width,
        height: createDto.height,
        mimetype: createDto.mimetype,
        extension: createDto.extension,
        md5: createDto.md5,
        sha1: createDto.sha1,
        links: createDto.links as unknown as Prisma.InputJsonValue,
        albumId: createDto.albumId,
        permission: createDto.permission ?? 1,
      },
    });
  }

  /**
   * 查询图片列表
   */
  async findAll(query: QueryUploadedImageDto) {
    const { page = 1, limit = 10, search, projectId } = query;

    const where: Prisma.UploadedImageWhereInput = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { originName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      // 如果传入 projectId，筛选该项目下的图片
      ...(projectId
        ? {
            contents: {
              some: {
                subProject: {
                  projectId,
                  isActive: true,
                },
              },
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.uploadedImage.count({ where }),
      this.prisma.uploadedImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contents: {
            where: { isActive: true },
            select: {
              id: true,
              subProject: {
                select: {
                  id: true,
                  name: true,
                  project: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return buildPaginationResponse(items, total, page, limit);
  }

  /**
   * 获取单个图片详情
   */
  async findOne(id: number) {
    const image = await this.prisma.uploadedImage.findUnique({
      where: { id },
      include: {
        contents: {
          where: { isActive: true },
          include: {
            subProject: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!image) {
      throw new NotFoundException('图片不存在');
    }

    return image;
  }

  /**
   * 物理删除图片（同时调用 PICUI API 删除）
   */
  async remove(id: number) {
    const image = await this.findOne(id);

    // 检查是否有关联的内容正在使用
    if (image.contents.length > 0) {
      throw new BadRequestException(
        `图片正在被 ${image.contents.length} 个内容使用，无法删除`,
      );
    }

    // 调用 PICUI API 删除图片
    try {
      await this.deletePicuiImage(image.key);
    } catch (error) {
      console.error('调用 PICUI 删除接口失败:', error);
      // 即使 PICUI 删除失败，也继续删除本地记录
    }

    // 删除本地记录
    await this.prisma.uploadedImage.delete({
      where: { id },
    });

    return { message: '图片删除成功' };
  }

  /**
   * 统计项目的图片容量
   */
  async getProjectCapacity(projectId: number) {
    // 查询该项目下所有子项目关联的图片
    const images = await this.prisma.uploadedImage.findMany({
      where: {
        isActive: true,
        contents: {
          some: {
            subProject: {
              projectId,
              isActive: true,
            },
          },
        },
      },
      select: {
        size: true,
      },
    });

    // 计算总容量（KB）
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const totalSizeMB = (totalSize / 1024).toFixed(2);

    return {
      projectId,
      imageCount: images.length,
      totalSize: parseFloat(totalSizeMB), // MB
      unit: 'MB',
    };
  }

  /**
   * 批量删除未使用的图片
   */
  async cleanUnused() {
    // 查找没有任何关联内容的图片
    const unusedImages = await this.prisma.uploadedImage.findMany({
      where: {
        isActive: true,
        contents: {
          none: {},
        },
      },
    });

    const deletedIds: number[] = [];

    for (const image of unusedImages) {
      try {
        await this.remove(image.id);
        deletedIds.push(image.id);
      } catch (error) {
        console.error(`删除图片 ${image.id} 失败:`, error);
      }
    }

    return {
      message: `清理完成，删除了 ${deletedIds.length} 张未使用的图片`,
      deletedIds,
    };
  }
}
