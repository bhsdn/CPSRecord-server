import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateTextCommandDto {
  @ApiProperty({ description: '子项目ID', example: 1 })
  @Type(() => Number)
  @IsInt({ message: '子项目ID必须是整数' })
  @Min(1, { message: '子项目ID必须大于0' })
  subProjectId!: number;

  @ApiProperty({ description: '文字口令内容', example: '复制这段代码打开淘宝即可' })
  @IsString({ message: '文字口令必须是字符串' })
  @Length(1, 1000, { message: '文字口令长度必须在1-1000个字符之间' })
  commandText!: string;

  @ApiProperty({ description: '有效天数', example: 7, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '有效天数必须是整数' })
  @Min(1, { message: '有效天数必须大于0' })
  expiryDays?: number;
}
