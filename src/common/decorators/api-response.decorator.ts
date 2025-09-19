import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';

interface ApiResponseWrapperOptions extends ApiResponseOptions {
  type?: 'array' | 'object';
}

export function ApiResponseWrapper(options: ApiResponseWrapperOptions) {
  return applyDecorators(
    ApiResponse({
      ...options,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: options.description ?? 'success' },
          code: { type: 'number', example: options.status ?? 200 },
          timestamp: { type: 'string', format: 'date-time' },
          data: options.type === 'array'
            ? { type: 'array', items: { type: 'object' } }
            : { type: 'object' },
          error: { type: 'string', nullable: true },
          details: { type: 'array', items: { type: 'string' }, nullable: true },

        },
      },
    }),
  );
}
