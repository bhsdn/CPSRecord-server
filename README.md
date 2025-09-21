# CPS Record Backend

基于 NestJS + Prisma + PostgreSQL 的项目内容管理系统后端实现，覆盖项目、子项目、内容类型、内容与文字口令的核心需求。

## 开发说明

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入数据库连接：

```bash
cp .env.example .env
```

3. 生成 Prisma Client 并执行数据库迁移

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. 运行开发服务器

```bash
npm run start:dev
```

5. 可选：种子数据

```bash
npm run seed
```

服务默认在 `http://localhost:3000` 运行，所有接口统一以 `/api` 为前缀，Swagger 文档位于 `http://localhost:3000/api/docs`。
