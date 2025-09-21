import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 统一的接口返回结构，前端只需要处理 success/data/message 即可
interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    // 通过上下文拿到原始响应对象，用于读取状态码
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((rawData: any) => {
        // 如果业务层已经手动返回了标准结构，则不做任何改写
        if (
          rawData &&
          typeof rawData === 'object' &&
          'success' in rawData &&
          'data' in rawData &&
          'code' in rawData &&
          'timestamp' in rawData
        ) {
          return rawData as StandardResponse<T>;
        }

        // 兜底读取状态码，并加上时间戳，方便排查问题
        const statusCode = response?.statusCode ?? 200;
        const timestamp = new Date().toISOString();

        if (rawData && typeof rawData === 'object' && 'message' in rawData) {
          // 仅返回 message 场景，例如删除成功
          if (Object.keys(rawData).length === 1) {
            return {
              success: true,
              message: rawData.message ?? 'success',
              data: null,
              code: statusCode,
              timestamp,
            };
          }

          if ('data' in rawData) {
            return {
              success: true,
              message: rawData.message ?? 'success',
              data: rawData.data ?? null,
              code: rawData.code ?? statusCode,
              timestamp,
            };
          }

          // 其余场景直接把剩余属性当作 data 返回
          const { message, code, ...rest } = rawData as {
            message?: string;
            code?: number;
          } & Record<string, unknown>;

          return {
            success: true,
            message: message ?? 'success',
            data: Object.keys(rest).length > 0 ? (rest as T) : null,
            code: code ?? statusCode,
            timestamp,
          };
        }

        return {
          success: true,
          message: 'success',
          data: (rawData ?? null) as T | null,
          code: statusCode,
          timestamp,
        };
      }),
    );
  }
}
