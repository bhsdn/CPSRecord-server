import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateSubProjectDto {
  @ApiProperty({ description: '所属项目ID', example: 1 })
  @Type(() => Number)
  @IsInt({ message: '项目ID必须是整数' })
  @Min(1, { message: '项目ID必须大于0' })
  projectId!: number;

  @ApiProperty({ description: '子项目名称', example: '服装类目' })
  @IsString({ message: '子项目名称必须是字符串' })
  @Length(1, 255, { message: '子项目名称长度必须在1-255个字符之间' })
  name!: string;

  @ApiProperty({ description: '子项目描述', required: false })
  @IsOptional()
  @IsString({ message: '子项目描述必须是字符串' })
  @Length(0, 1000, { message: '子项目描述长度不能超过1000个字符' })
  description?: string;

  @ApiProperty({ description: '排序序号', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '排序序号必须是整数' })
  sortOrder?: number;
}
