import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryTextCommandDto {
  @ApiProperty({ description: '子项目ID', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '子项目ID必须是整数' })
  @Min(1, { message: '子项目ID必须大于0' })
  subProjectId?: number;
}
