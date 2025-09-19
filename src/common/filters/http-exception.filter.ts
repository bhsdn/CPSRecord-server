import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as Record<string, any>).message ?? message;
      error = exception.name;

      if (
        typeof res === 'object' &&
        res !== null &&
        'message' in (res as Record<string, any>) &&
        Array.isArray((res as Record<string, any>).message)
      ) {
        details = (res as Record<string, any>).message as string[];
        message = details.join('; ');
      }
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      success: false,
      message,
      data: null,
      code: status,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      details,
    });
  }
}
