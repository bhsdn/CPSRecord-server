import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((rawData: any) => {
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

        const statusCode = response?.statusCode ?? 200;
        const timestamp = new Date().toISOString();

        if (rawData && typeof rawData === 'object' && 'message' in rawData) {
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
