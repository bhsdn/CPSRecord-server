import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

class BulkTextCommandItemDto {
  @ApiProperty({ description: '子项目 ID', example: 1 })
  @Type(() => Number)
  @IsInt({ message: '子项目 ID 必须是整数' })
  @Min(1, { message: '子项目 ID 必须大于 0' })
  subProjectId!: number;

  @ApiProperty({ description: '口令内容', example: '复制这段话打开手机淘宝' })
  @IsNotEmpty({ message: '口令内容不能为空' })
  commandText!: string;

  @ApiProperty({ description: '有效天数', example: 7 })
  @Type(() => Number)
  @IsInt({ message: '有效天数必须是整数' })
  @IsPositive({ message: '有效天数必须大于 0' })
  expiryDays!: number;
}

export class BulkCreateTextCommandDto {
  @ApiProperty({ type: [BulkTextCommandItemDto], description: '批量口令列表' })
  @IsArray({ message: '批量数据必须是数组' })
  @ArrayMinSize(1, { message: '至少需要 1 条口令数据' })
  @ValidateNested({ each: true })
  @Type(() => BulkTextCommandItemDto)
  commands!: BulkTextCommandItemDto[];
}

export { BulkTextCommandItemDto };
