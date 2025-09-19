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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@ApiTags('项目管理')
@Controller('projects')
@UseInterceptors(ResponseInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
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
  @ApiResponseWrapper({ status: 200, description: '获取项目列表成功', type: 'object' })
  async findAll(@Query() query: QueryProjectDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiResponseWrapper({ status: 200, description: '获取项目详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponseWrapper({ status: 201, description: '创建项目成功' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiResponseWrapper({ status: 200, description: '更新项目成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiResponseWrapper({ status: 200, description: '删除项目成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  @Get(':id/sub-projects')
  @ApiOperation({ summary: '获取项目的子项目列表' })
  @ApiResponseWrapper({ status: 200, description: '获取子项目列表成功', type: 'array' })
  async getSubProjects(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getSubProjects(id);
  }
}
