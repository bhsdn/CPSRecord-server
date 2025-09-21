import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// 启动入口函数，负责初始化整个 Nest 应用
async function bootstrap() {
  // 创建根模块实例，这里会加载所有业务模块
  const app = await NestFactory.create(AppModule);

  // Helmet 提供通用的 HTTP 头安全防护
  app.use(helmet());
  // 统一给所有接口加上 api 前缀，方便前端区分版本
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // 全局管道/过滤器/拦截器用于：参数校验、异常格式化、日志和返回包装
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('CPS Record API')
    .setDescription('API documentation for CPS Record content management system')
    .setVersion('1.0.0')
    .build();

  // 生成 Swagger 文档，方便前端联调
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
