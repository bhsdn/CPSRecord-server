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
import { TextCommandsService } from './text-commands.service';
import { CreateTextCommandDto } from './dto/create-text-command.dto';
import { UpdateTextCommandDto } from './dto/update-text-command.dto';
import { QueryTextCommandDto } from './dto/query-text-command.dto';

@ApiTags('文字口令管理')
@Controller('text-commands')
@UseInterceptors(ResponseInterceptor)
export class TextCommandsController {
  constructor(private readonly textCommandsService: TextCommandsService) {}

  @Get()
  @ApiOperation({ summary: '获取文字口令列表' })
  @ApiQuery({ name: 'subProjectId', required: false, type: Number, description: '子项目ID' })
  @ApiResponseWrapper({ status: 200, description: '获取文字口令列表成功', type: 'array' })
  async findAll(@Query() query: QueryTextCommandDto) {
    return this.textCommandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文字口令详情' })
  @ApiResponseWrapper({ status: 200, description: '获取文字口令详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.textCommandsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建文字口令' })
  @ApiResponseWrapper({ status: 201, description: '创建文字口令成功' })
  async create(@Body() dto: CreateTextCommandDto) {
    return this.textCommandsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文字口令' })
  @ApiResponseWrapper({ status: 200, description: '更新文字口令成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTextCommandDto,
  ) {
    return this.textCommandsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文字口令' })
  @ApiResponseWrapper({ status: 200, description: '删除文字口令成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.textCommandsService.remove(id);
  }
}
