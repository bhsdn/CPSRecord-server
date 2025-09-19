import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ExpiryStatus } from '../../../common/utils/date.util';

export class QueryTextCommandDto {
  @ApiProperty({ description: '子项目ID', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '子项目ID必须是整数' })
  @Min(1, { message: '子项目ID必须大于0' })
  subProjectId?: number;

  @ApiProperty({
    description: '到期状态筛选',
    required: false,
    enum: ['safe', 'warning', 'danger'],
  })
  @IsOptional()
  @IsEnum(['safe', 'warning', 'danger'], {
    message: '到期状态仅支持 safe/warning/danger',
  })
  status?: ExpiryStatus;
}
