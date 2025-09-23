import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseWrapper } from '../../common/decorators/api-response.decorator';
import { ContentTypesService } from './content-types.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { CacheTTL } from '../../common/decorators/cache.decorator';

@ApiTags('内容类型管理')
@Controller('content-types')
export class ContentTypesController {
  constructor(private readonly contentTypesService: ContentTypesService) {}

  @Get()
  @CacheTTL(60_000)
  @ApiOperation({ summary: '获取内容类型列表' })
  @ApiResponseWrapper({ status: 200, description: '获取内容类型列表成功', dataType: 'array' })
  async findAll() {
    return this.contentTypesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '创建内容类型' })
  @ApiResponseWrapper({ status: 201, description: '创建内容类型成功' })
  async create(@Body() dto: CreateContentTypeDto) {
    return this.contentTypesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新内容类型' })
  @ApiResponseWrapper({ status: 200, description: '更新内容类型成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentTypeDto,
  ) {
    return this.contentTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除内容类型' })
  @ApiResponseWrapper({ status: 200, description: '删除内容类型成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentTypesService.remove(id);
  }
}
