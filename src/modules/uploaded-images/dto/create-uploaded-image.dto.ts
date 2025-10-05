import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsInt, Min, Max, IsObject } from 'class-validator';

export class CreateUploadedImageDto {
  @ApiProperty({ description: 'PICUI 图片唯一密钥' })
  @IsString()
  key!: string;

  @ApiProperty({ description: '图片名称' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '图片路径' })
  @IsString()
  pathname!: string;

  @ApiProperty({ description: '原始文件名' })
  @IsString()
  originName!: string;

  @ApiProperty({ description: '图片大小（KB）' })
  @IsNumber()
  @Min(0)
  size!: number;

  @ApiPropertyOptional({ description: '图片宽度' })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: '图片高度' })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiProperty({ description: 'MIME 类型' })
  @IsString()
  mimetype!: string;

  @ApiProperty({ description: '文件扩展名' })
  @IsString()
  extension!: string;

  @ApiProperty({ description: 'MD5 值' })
  @IsString()
  md5!: string;

  @ApiProperty({ description: 'SHA1 值' })
  @IsString()
  sha1!: string;

  @ApiProperty({ description: '链接信息对象', type: 'object' })
  @IsObject()
  links!: {
    url: string;
    html: string;
    bbcode: string;
    markdown: string;
    markdown_with_link: string;
    thumbnail_url: string;
    delete_url: string;
  };

  @ApiPropertyOptional({ description: 'PICUI 相册 ID' })
  @IsOptional()
  @IsInt()
  albumId?: number;

  @ApiPropertyOptional({ description: '权限：1=公开，0=私有', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  permission?: number;
}
