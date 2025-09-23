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
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { CacheTTL } from '../../common/decorators/cache.decorator';

@ApiTags('内容管理')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @CacheTTL(20_000)
  @ApiOperation({ summary: '获取子项目内容列表' })
  @ApiQuery({ name: 'subProjectId', required: false, type: Number, description: '子项目ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['safe', 'warning', 'danger'],
    description: '根据到期状态筛选内容',
  })
  @ApiResponseWrapper({ status: 200, description: '获取内容列表成功', dataType: 'array' })
  async findAll(@Query() query: QueryContentDto) {
    return this.contentsService.findAll(query);
  }

  @Get(':id')
  @CacheTTL(30_000)
  @ApiOperation({ summary: '获取子项目内容详情' })
  @ApiResponseWrapper({ status: 200, description: '获取内容详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建子项目内容' })
  @ApiResponseWrapper({ status: 201, description: '创建内容成功' })
  async create(@Body() dto: CreateContentDto) {
    return this.contentsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新子项目内容' })
  @ApiResponseWrapper({ status: 200, description: '更新内容成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除子项目内容' })
  @ApiResponseWrapper({ status: 200, description: '删除内容成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.remove(id);
  }

  @Post('refresh-expiry')
  @ApiOperation({ summary: '刷新到期内容的状态标记' })
  @ApiResponseWrapper({ status: 200, description: '内容到期状态刷新成功' })
  async refreshExpiryMetadata() {
    return this.contentsService.refreshExpiryMetadata();
  }
}
