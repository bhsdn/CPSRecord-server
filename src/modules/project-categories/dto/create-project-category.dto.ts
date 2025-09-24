import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProjectCategoryDto {
  @ApiProperty({ description: '分类名称', example: '电商渠道' })
  @IsString({ message: '分类名称必须是字符串' })
  @Length(1, 100, { message: '分类名称长度必须在1-100个字符之间' })
  name!: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString({ message: '分类描述必须是字符串' })
  @Length(0, 1000, { message: '分类描述长度不能超过1000个字符' })
  description?: string;

  @ApiProperty({ description: '排序权重', required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '排序权重必须是整数' })
  @Min(0, { message: '排序权重不能为负数' })
  sortOrder?: number;

  @ApiProperty({
    description: '是否启用',
    required: false,
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '是否启用必须是布尔值' })
  isActive?: boolean;
}
