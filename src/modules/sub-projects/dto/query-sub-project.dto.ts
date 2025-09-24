import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QuerySubProjectDto {
  @ApiProperty({ description: '所属项目ID', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '项目ID必须是整数' })
  @Min(1, { message: '项目ID必须大于0' })
  projectId?: number;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @ApiProperty({
    description: '是否开启文档生成',
    required: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '是否开启文档生成必须是布尔值' })
  documentationEnabled?: boolean;
}
