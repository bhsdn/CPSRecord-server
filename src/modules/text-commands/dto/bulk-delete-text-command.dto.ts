import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDeleteTextCommandDto {
  @ApiProperty({ description: '待删除的文字口令ID列表', type: [Number] })
  @IsArray({ message: 'ID 列表必须是数组' })
  @ArrayMinSize(1, { message: '请至少选择一个文字口令' })
  @Type(() => Number)
  @IsInt({ each: true, message: '文字口令ID必须是整数' })
  @Min(1, { each: true, message: '文字口令ID必须大于0' })
  ids!: number[];
}
