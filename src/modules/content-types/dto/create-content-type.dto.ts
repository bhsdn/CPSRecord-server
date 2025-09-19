import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateContentTypeDto {
  @ApiProperty({ description: '类型名称', example: '图片链接' })
  @IsString({ message: '类型名称必须是字符串' })
  @Length(1, 100, { message: '类型名称长度必须在1-100个字符之间' })
  name!: string;

  @ApiProperty({ description: '字段类型', example: 'url' })
  @IsString({ message: '字段类型必须是字符串' })
  @Length(1, 50, { message: '字段类型长度必须在1-50个字符之间' })
  fieldType!: string;

  @ApiProperty({ description: '是否需要设置有效期', default: false, required: false })
  @IsOptional()
  @IsBoolean({ message: '是否需要设置有效期必须是布尔值' })
  hasExpiry?: boolean = false;

  @ApiProperty({ description: '是否系统内置类型', default: false, required: false })
  @IsOptional()
  @IsBoolean({ message: '是否系统内置类型必须是布尔值' })
  isSystem?: boolean = false;
}
