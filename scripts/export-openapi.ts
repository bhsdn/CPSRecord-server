import { writeFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';
import { buildSwaggerConfig } from '../src/config/swagger.config';

async function exportOpenAPI() {
  try {
    // 确保输出目录存在
    const docsDir = path.join(process.cwd(), 'docs');
    console.log(`准备将文档导出到: ${docsDir}`);
    
    // 强制创建目录（包括任何中间目录）
    mkdirSync(docsDir, { recursive: true, mode: 0o755 });
    const app = await NestFactory.create(AppModule);
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    const outputPath = path.join(docsDir, 'openapi.json');
    writeFileSync('docs/openapi.json', JSON.stringify(document, null, 2));
    console.log(`✅ OpenAPI文档已成功导出到: ${outputPath}`);
    await app.close();
  } catch (error) {
    console.error('❌ 导出OpenAPI文档失败:', error);
    process.exit(1);
  }
}

exportOpenAPI();
