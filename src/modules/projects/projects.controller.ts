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
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponseWrapper } from '../../common/decorators/api-response.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@ApiTags('项目管理')
@Controller('projects')
export class ProjectsController {
  // 注入项目服务，所有数据库逻辑都放在 service 中
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: '项目分类ID',
  })
  @ApiResponseWrapper({
    status: 200,
    description: '获取项目列表成功',
    dataType: 'object',
  })
  async findAll(@Query() query: QueryProjectDto) {
    // 支持分页/搜索的项目列表
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiResponseWrapper({ status: 200, description: '获取项目详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // 通过项目 id 拉取详情
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponseWrapper({ status: 201, description: '创建项目成功' })
  async create(@Body() dto: CreateProjectDto) {
    // 创建项目时会自动带上排序序号
    return this.projectsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiResponseWrapper({ status: 200, description: '更新项目成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    // 更新项目信息，部分字段可选
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiResponseWrapper({ status: 200, description: '删除项目成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    // 软删除项目，同时会级联处理子项目
    return this.projectsService.remove(id);
  }

  @Get(':id/sub-projects')
  @ApiOperation({ summary: '获取项目的子项目列表' })
  @ApiResponseWrapper({
    status: 200,
    description: '获取子项目列表成功',
    dataType: 'array',
  })
  async getSubProjects(@Param('id', ParseIntPipe) id: number) {
    // 透出项目下的子项目列表，方便前端联动展示
    return this.projectsService.getSubProjects(id);
  }
}
