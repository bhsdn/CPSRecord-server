import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: '淘宝CPS推广' })
  @IsString({ message: '项目名称必须是字符串' })
  @Length(1, 255, { message: '项目名称长度必须在1-255个字符之间' })
  name!: string;

  @ApiProperty({
    description: '项目描述',
    example: '主要推广淘宝商品，包含服装、数码等分类',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @Length(0, 1000, { message: '项目描述长度不能超过1000个字符' })
  description?: string;
}
