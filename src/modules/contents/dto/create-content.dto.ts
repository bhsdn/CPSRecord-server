import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from "class-validator";

export class CreateContentDto {
  @ApiProperty({ description: "子项目ID", example: 1 })
  @Type(() => Number)
  @IsInt({ message: "子项目ID必须是整数" })
  @Min(1, { message: "子项目ID必须大于0" })
  subProjectId!: number;

  @ApiProperty({ description: "内容类型ID", example: 1 })
  @Type(() => Number)
  @IsInt({ message: "内容类型ID必须是整数" })
  @Min(1, { message: "内容类型ID必须大于0" })
  contentTypeId!: number;

  @ApiProperty({
    description: "内容值",
    example: "https://example.com/image.jpg",
  })
  @IsString({ message: "内容值必须是字符串" })
  @Length(1, 2000, { message: "内容值长度必须在1-2000个字符之间" })
  contentValue!: string;

  @ApiProperty({
    description: "上传图片ID（图片类型内容关联）",
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "上传图片ID必须是整数" })
  @Min(1, { message: "上传图片ID必须大于0" })
  uploadedImageId?: number;

  @ApiProperty({ description: "有效天数", example: 30, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "有效天数必须是整数" })
  @Min(1, { message: "有效天数必须大于0" })
  expiryDays?: number;

  @ApiProperty({
    description: "是否在文档中显示",
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "是否在文档中显示必须是布尔值" })
  showInDocumentation?: boolean;
}
