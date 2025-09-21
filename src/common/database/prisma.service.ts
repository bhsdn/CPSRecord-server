import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
// Prisma 连接管理，封装成 Nest 可注入的服务
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // 模块加载时建立数据库连接
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // 监听进程退出事件，确保连接被优雅关闭
    (this.$on as unknown as (event: 'beforeExit', callback: () => Promise<void>) => void)(
      'beforeExit',
      async () => {
        await app.close();
      },
    );
  }
}
