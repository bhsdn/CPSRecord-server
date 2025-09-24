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
import { ProjectCategoriesService } from './project-categories.service';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
import { QueryProjectCategoryDto } from './dto/query-project-category.dto';

@ApiTags('项目分类管理')
@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(
    private readonly projectCategoriesService: ProjectCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取项目分类列表' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: '是否包含已停用分类',
  })
  @ApiResponseWrapper({
    status: 200,
    description: '获取项目分类列表成功',
    dataType: 'array',
  })
  async findAll(@Query() query: QueryProjectCategoryDto) {
    return this.projectCategoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目分类详情' })
  @ApiResponseWrapper({ status: 200, description: '获取项目分类详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectCategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建项目分类' })
  @ApiResponseWrapper({ status: 201, description: '创建项目分类成功' })
  async create(@Body() dto: CreateProjectCategoryDto) {
    return this.projectCategoriesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目分类' })
  @ApiResponseWrapper({ status: 200, description: '更新项目分类成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectCategoryDto,
  ) {
    return this.projectCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目分类' })
  @ApiResponseWrapper({ status: 200, description: '删除项目分类成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectCategoriesService.remove(id);
  }
}
