import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UploadedImagesService } from './uploaded-images.service';
import { CreateUploadedImageDto } from './dto/create-uploaded-image.dto';
import { QueryUploadedImageDto } from './dto/query-uploaded-image.dto';

@ApiTags('上传图片管理')
@Controller('uploaded-images')
export class UploadedImagesController {
  constructor(private readonly uploadedImagesService: UploadedImagesService) {}

  @Post()
  @ApiOperation({ summary: '保存上传的图片信息' })
  @ApiResponse({ status: 201, description: '保存成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  create(@Body() createDto: CreateUploadedImageDto) {
    return this.uploadedImagesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '查询图片列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryUploadedImageDto) {
    return this.uploadedImagesService.findAll(query);
  }

  @Get('project/:projectId/capacity')
  @ApiOperation({ summary: '统计项目图片容量' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiResponse({ status: 200, description: '统计成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  getProjectCapacity(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.uploadedImagesService.getProjectCapacity(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取图片详情' })
  @ApiParam({ name: 'id', description: '图片 ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '图片不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.uploadedImagesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '物理删除图片（同时删除 PICUI 上的图片）' })
  @ApiParam({ name: 'id', description: '图片 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '图片正在使用中，无法删除' })
  @ApiResponse({ status: 404, description: '图片不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadedImagesService.remove(id);
  }

  @Post('clean-unused')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量清理未使用的图片' })
  @ApiResponse({ status: 200, description: '清理成功' })
  cleanUnused() {
    return this.uploadedImagesService.cleanUnused();
  }
}
