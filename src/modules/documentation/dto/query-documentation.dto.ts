import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryDocumentationDto {
  @ApiProperty({ description: '项目ID', required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '项目ID必须是整数' })
  @Min(1, { message: '项目ID必须大于0' })
  projectId?: number;

  @ApiProperty({ description: '项目分类ID', required: false, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '项目分类ID必须是整数' })
  @Min(1, { message: '项目分类ID必须大于0' })
  categoryId?: number;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
