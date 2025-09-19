import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { ApiResponseWrapper } from '../../common/decorators/api-response.decorator';
import { SubProjectsService } from './sub-projects.service';
import { CreateSubProjectDto } from './dto/create-sub-project.dto';
import { UpdateSubProjectDto } from './dto/update-sub-project.dto';
import { QuerySubProjectDto } from './dto/query-sub-project.dto';
import { ReorderSubProjectDto } from './dto/reorder-sub-project.dto';

@ApiTags('子项目管理')
@Controller('sub-projects')
@UseInterceptors(ResponseInterceptor)
export class SubProjectsController {
  constructor(private readonly subProjectsService: SubProjectsService) {}

  @Get()
  @ApiOperation({ summary: '获取子项目列表' })
  @ApiQuery({ name: 'projectId', required: false, type: Number, description: '项目ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词' })
  @ApiResponseWrapper({ status: 200, description: '获取子项目列表成功', type: 'array' })
  async findAll(@Query() query: QuerySubProjectDto) {
    return this.subProjectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取子项目详情' })
  @ApiResponseWrapper({ status: 200, description: '获取子项目详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subProjectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建子项目' })
  @ApiResponseWrapper({ status: 201, description: '创建子项目成功' })
  async create(@Body() dto: CreateSubProjectDto) {
    return this.subProjectsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新子项目' })
  @ApiResponseWrapper({ status: 200, description: '更新子项目成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubProjectDto,
  ) {
    return this.subProjectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除子项目' })
  @ApiResponseWrapper({ status: 200, description: '删除子项目成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.subProjectsService.remove(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: '更新子项目排序' })
  @ApiResponseWrapper({ status: 200, description: '子项目排序更新成功' })
  async reorder(@Body() dto: ReorderSubProjectDto) {
    return this.subProjectsService.reorder(dto);
  }
}
