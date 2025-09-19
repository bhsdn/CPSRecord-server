import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();
    this.logger.log(`${method} ${url} - Request received`);

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(`${method} ${url} - Completed in ${Date.now() - now}ms`),
        error: (error) =>
          this.logger.error(
            `${method} ${url} - Failed in ${Date.now() - now}ms: ${error.message}`,
          ),
      }),
    );
  }
}
