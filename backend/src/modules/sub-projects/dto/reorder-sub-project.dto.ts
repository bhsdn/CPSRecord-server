import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';

class SubProjectOrderItem {
  @ApiProperty({ description: '子项目ID', example: 1 })
  @Type(() => Number)
  @IsInt({ message: '子项目ID必须是整数' })
  @Min(1, { message: '子项目ID必须大于0' })
  id!: number;

  @ApiProperty({ description: '排序值', example: 1 })
  @Type(() => Number)
  @IsInt({ message: '排序值必须是整数' })
  sortOrder!: number;
}

export class ReorderSubProjectDto {
  @ApiProperty({
    description: '排序数据',
    type: [SubProjectOrderItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubProjectOrderItem)
  items!: SubProjectOrderItem[];
}
