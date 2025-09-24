import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponseWrapper } from '../../common/decorators/api-response.decorator';
import { DocumentationService } from './documentation.service';
import { QueryDocumentationDto } from './dto/query-documentation.dto';

@ApiTags('文档中心')
@Controller('documentation')
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}

  @Get()
  @ApiOperation({ summary: '获取开启文档的子项目列表' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: Number,
    description: '项目ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: '项目分类ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词',
  })
  @ApiResponseWrapper({
    status: 200,
    description: '获取文档列表成功',
    dataType: 'array',
  })
  async findAll(@Query() query: QueryDocumentationDto) {
    return this.documentationService.findAll(query);
  }
}
