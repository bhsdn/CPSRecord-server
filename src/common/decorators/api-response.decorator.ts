import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';

// 用于在 Swagger 中统一展示标准响应结构
type ApiResponseWrapperOptions = Omit<ApiResponseOptions, 'schema'> & {
  dataType?: 'array' | 'object';
};

export function ApiResponseWrapper(options: ApiResponseWrapperOptions) {
  const { dataType = 'object', ...apiOptions } = options;
  return applyDecorators(
    ApiResponse({
      ...apiOptions,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: apiOptions.description ?? 'success' },
          code: { type: 'number', example: apiOptions.status ?? 200 },
          timestamp: { type: 'string', format: 'date-time' },
          data: dataType === 'array'
            ? { type: 'array', items: { type: 'object' } }
            : { type: 'object' },
          error: { type: 'string', nullable: true },
          details: { type: 'array', items: { type: 'string' }, nullable: true },
        },
      },
    }),
  );
}
