import { DocumentBuilder } from '@nestjs/swagger';

export const buildSwaggerConfig = () =>
  new DocumentBuilder()
    .setTitle('CPS Record API')
    .setDescription('API documentation for CPS Record management system')
    .setVersion('1.0.0')
    .build();
