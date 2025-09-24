import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryProjectCategoryDto {
  @ApiProperty({
    description: '是否包含已停用分类',
    required: false,
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '是否包含已停用分类必须是布尔值' })
  includeInactive?: boolean;
}
