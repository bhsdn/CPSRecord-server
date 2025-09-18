# 项目内容管理系统 PRD

## 1. 项目概述

### 1.1 项目背景

基于 CPS 推广业务需求，需要一个高效的项目内容管理系统，用于管理多个推广项目及其相关内容，提升内容管理效率和团队协作能力。

### 1.2 项目目标

- 提供直观的项目管理界面，支持自定义项目创建
- 实现灵活的子项目管理，满足不同推广场景需求
- 支持动态内容类型配置，适应多样化的推广素材管理
- 自动化处理时效性内容，减少人工维护成本
- 提供移动端友好的响应式体验

### 1.3 技术架构

- **前端**: Vue3 + TypeScript + Element Plus + Vite
- **后端**: NestJS + TypeScript (传统服务器架构)
- **数据库**: PostgreSQL
- **部署**: 前端 Vercel，后端独立服务器/容器部署
- **设计**: 移动端优先的响应式设计

## 2. 需求分析

### 2.1 核心用户场景

#### 场景 1: CPS 推广项目管理

- **角色**: CPS 推广专员
- **需求**: 管理多个推广平台的项目，每个项目包含不同的子项目（如不同商品分类）
- **痛点**: 当前缺乏统一的内容管理平台，信息分散难以维护

#### 场景 2: 推广素材管理

- **角色**: 内容运营人员
- **需求**: 管理各类推广素材（链接、图片、口令等），并自动处理时效性内容
- **痛点**: 手动管理素材过期时间容易出错，缺乏系统化管理

#### 场景 3: 团队协作

- **角色**: 团队成员
- **需求**: 快速查找和使用项目相关内容，实时了解内容状态
- **痛点**: 信息获取效率低，缺乏统一的信息源

### 2.2 功能需求优先级

| 优先级 | 功能模块     | 说明                   |
| ------ | ------------ | ---------------------- |
| P0     | 项目管理     | 基础的项目 CRUD 操作   |
| P0     | 子项目管理   | 子项目的创建和管理     |
| P0     | 动态内容管理 | 灵活的内容类型配置     |
| P0     | 时效性处理   | 自动计算和显示过期时间 |
| P1     | 移动端适配   | 响应式界面设计         |
| P1     | 搜索和筛选   | 快速定位内容           |
| P2     | 批量操作     | 提升操作效率           |
| P2     | 数据导出     | 内容备份和分享         |

## 3. 功能设计

### 3.1 项目管理模块

#### 3.1.1 功能描述

用户可以自定义创建、编辑、删除项目，每个项目作为独立的管理单元。

#### 3.1.2 功能详情

- **创建项目**:
  - 输入项目名称（必填）
  - 输入项目描述（可选）
  - 自动记录创建时间和更新时间
- **项目列表**:
  - 显示所有项目的卡片视图
  - 显示项目名称、描述、子项目数量、最后更新时间
  - 支持搜索功能
- **编辑项目**: 修改项目名称和描述
- **删除项目**: 软删除，保留数据但不显示

#### 3.1.3 技术实现要点

```sql
-- 项目表设计
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

### 3.2 子项目管理模块

#### 3.2.1 功能描述

每个项目可以包含多个子项目，支持灵活的层级管理和排序。

#### 3.2.2 功能详情

- **创建子项目**:
  - 选择所属项目
  - 输入子项目名称和描述
  - 支持自定义排序
- **子项目列表**:
  - 按排序显示子项目
  - 显示内容数量和口令数量统计
- **排序管理**: 支持拖拽排序或手动设置序号

#### 3.2.3 数据结构

```sql
CREATE TABLE sub_projects (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

### 3.3 动态内容管理模块

#### 3.3.1 功能描述

支持灵活配置内容类型，每个子项目可以包含多种类型的内容，内容类型可动态扩展。

#### 3.3.2 预设内容类型

- **短链接**: URL 类型，无时效性
- **长链接**: URL 类型，无时效性
- **团口令**: 文本类型，有时效性（需要设置有效天数）
- **唤起协议**: 文本类型，无时效性
- **H5 图片**: 图片类型，无时效性
- **小程序图片**: 图片类型，无时效性

#### 3.3.3 自定义内容类型

- 管理员可以添加新的内容类型
- 每个内容类型包含：名称、字段类型、是否有时效性
- 支持的字段类型：text、url、image、date、number

#### 3.3.4 时效性处理

- **输入方式**: 用户输入天数（整数）
- **系统处理**: 自动计算到期日期（yyyy-MM-dd 格式）
- **显示逻辑**:
  - 绿色：距离到期 > 7 天
  - 黄色：距离到期 3-7 天
  - 红色：距离到期 < 3 天或已过期

#### 3.3.5 数据结构

```sql
-- 内容类型定义表
CREATE TABLE content_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    field_type VARCHAR(50) NOT NULL, -- text, url, image, date, number
    has_expiry BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 子项目内容表（EAV模式）
CREATE TABLE sub_project_contents (
    id SERIAL PRIMARY KEY,
    sub_project_id INTEGER NOT NULL REFERENCES sub_projects(id),
    content_type_id INTEGER NOT NULL REFERENCES content_types(id),
    content_value TEXT,
    expiry_days INTEGER,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(sub_project_id, content_type_id)
);
```

### 3.4 文字口令管理模块

#### 3.4.1 功能描述

每个子项目可以管理多个文字口令，每个口令都有独立的到期时间。

#### 3.4.2 功能详情

- **添加口令**: 输入口令内容和有效天数
- **口令列表**: 显示所有口令及其到期状态
- **到期提醒**: 根据剩余时间显示不同颜色状态
- **批量操作**: 支持批量删除过期口令

#### 3.4.3 数据结构

```sql
CREATE TABLE text_commands (
    id SERIAL PRIMARY KEY,
    sub_project_id INTEGER NOT NULL REFERENCES sub_projects(id),
    command_text TEXT NOT NULL,
    expiry_days INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

## 4. 用户界面设计

### 4.1 设计原则

- **移动端优先**: 界面设计优先考虑移动端体验
- **直观易用**: 减少操作步骤，提供清晰的视觉反馈
- **信息层次**: 合理的信息架构和视觉层次
- **状态可见**: 清晰显示内容状态和时效性信息

### 4.2 页面结构

#### 4.2.1 项目管理页面

```
┌─────────────────────────────────┐
│ 项目管理 [+新建项目]             │
├─────────────────────────────────┤
│ [搜索框]                        │
├─────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐      │
│ │项目A     │ │项目B     │      │
│ │描述...   │ │描述...   │      │
│ │5个子项目 │ │3个子项目 │      │
│ │2小时前   │ │1天前     │      │
│ └──────────┘ └──────────┘      │
└─────────────────────────────────┘
```

#### 4.2.2 子项目详情页面

```
┌─────────────────────────────────┐
│ ← 项目A                         │
├─────────────────────────────────┤
│ [+新建子项目]                    │
├─────────────────────────────────┤
│ 子项目列表:                     │
│ ┌─────────────────────────────┐ │
│ │ 子项目A1                    │ │
│ │ ├─ 短链接: xxx              │ │
│ │ ├─ 团口令: xxx [🟢7天]      │ │
│ │ ├─ 文字口令(3个) [🟡2天]    │ │
│ │ └─ [编辑] [删除]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 4.3 响应式设计

#### 4.3.1 断点设计

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### 4.3.2 适配策略

- **Mobile**: 单列布局，大按钮设计，下拉菜单
- **Tablet**: 双列布局，侧边栏导航
- **Desktop**: 多列布局，顶部导航，更多操作选项

## 5. 技术实现方案

### 5.1 前端架构

#### 5.1.1 技术栈

- **Vue3**: 使用 Composition API
- **TypeScript**: 全量类型支持
- **Element Plus**: 企业级 UI 组件库
- **Vite**: 快速构建工具
- **Vue Router**: 路由管理
- **Pinia**: 状态管理
- **Tailwind CSS**: 样式框架

#### 5.1.2 目录结构

```
src/
├── components/          # 可复用组件
│   ├── ProjectCard.vue
│   ├── SubProjectManager.vue
│   └── ContentEditor.vue
├── views/              # 页面组件
│   ├── ProjectList.vue
│   └── ProjectDetail.vue
├── stores/             # 状态管理
│   ├── projects.ts
│   └── content.ts
├── composables/        # 组合式函数
│   ├── useProjects.ts
│   └── useDateFormat.ts
├── utils/              # 工具函数
│   ├── api.ts
│   ├── date.ts
│   └── validation.ts
└── types/              # 类型定义
    └── index.ts
```

### 5.2 后端架构

#### 5.2.1 NestJS 传统服务器架构

**技术栈**:

- **NestJS**: 基于 TypeScript 的 Node.js 框架
- **TypeScript**: 全量类型安全
- **Express**: HTTP 服务器引擎
- **Prisma**: 数据库 ORM
- **Class Validator**: 参数验证
- **Swagger**: API 文档自动生成
- **JWT**: 身份验证 (未来功能)
- **PM2**: 进程管理器
- **PostgreSQL**: 数据库

**项目结构** (传统 NestJS 服务器):

```
backend/
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── modules/
│   │   ├── projects/
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.module.ts
│   │   │   └── dto/
│   │   │       ├── create-project.dto.ts
│   │   │       └── update-project.dto.ts
│   │   ├── sub-projects/
│   │   │   ├── sub-projects.controller.ts
│   │   │   ├── sub-projects.service.ts
│   │   │   └── sub-projects.module.ts
│   │   ├── contents/
│   │   │   ├── contents.controller.ts
│   │   │   ├── contents.service.ts
│   │   │   └── contents.module.ts
│   │   ├── text-commands/
│   │   │   ├── text-commands.controller.ts
│   │   │   ├── text-commands.service.ts
│   │   │   └── text-commands.module.ts
│   │   └── content-types/
│   │       ├── content-types.controller.ts
│   │       ├── content-types.service.ts
│   │       └── content-types.module.ts
│   ├── common/
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── decorators/
│   │       └── api-response.decorator.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   └── swagger.config.ts
│   └── types/
│       └── api.types.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
└── .dockerignore
```

#### 5.2.2 API 设计原则

**RESTful API 设计**:

- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

**响应格式标准化**:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
  timestamp: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

**错误处理**:

- 统一异常过滤器
- 参数验证管道
- HTTP 状态码标准化
- 详细错误信息返回

#### 5.2.3 数据库设计特点

- **PostgreSQL**: 关系型数据库，支持复杂查询
- **Prisma ORM**: 类型安全的数据库操作
- **EAV 模式**: 动态内容类型存储
- **软删除**: 数据安全，支持恢复
- **自动触发器**: 自动计算到期时间
- **索引优化**: 提升查询性能

**Prisma Schema 示例**:

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  isActive    Boolean  @default(true) @map("is_active")

  subProjects SubProject[]

  @@map("projects")
}

model SubProject {
  id          Int      @id @default(autoincrement())
  projectId   Int      @map("project_id")
  name        String   @db.VarChar(255)
  description String?
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  isActive    Boolean  @default(true) @map("is_active")

  project      Project         @relation(fields: [projectId], references: [id])
  contents     SubProjectContent[]
  textCommands TextCommand[]

  @@map("sub_projects")
}
```

### 5.3 传统服务器部署方案

#### 5.3.1 NestJS 应用配置

**main.ts 应用启动**:

````typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS 配置
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('ConvertLink Pro API')
    .setDescription('CPS 推广项目内容管理系统 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 应用已启动: http://localhost:${port}`);
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
}
bootstrap();

#### 5.3.2 环境变量配置

**本地开发** (`.env.local`):
```env
# 数据库配置
POSTGRES_URL=postgresql://username:password@localhost:5432/convertlinkpro

# 应用配置
NODE_ENV=development

# CORS 配置 (本地开发时不需要，已在代码中设置为 *)
````

**Vercel 生产环境变量**:

```env
POSTGRES_URL=postgresql://username:password@hostname:5432/convertlinkpro
NODE_ENV=production
```

#### 5.3.3 数据库连接优化

**连接池配置** (`api/_utils/database.ts`):

```typescript
import { PrismaClient } from '@prisma/client'

// Serverless 环境下的全局 Prisma 实例
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_URL,
      },
    },
  })
} else {
  // 开发环境下重用连接
  if (!(global as any).prisma) {
    ;(global as any).prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
  prisma = (global as any).prisma
}

export { prisma }

// 数据库操作函数
export async function getProjects(query: any) {
  const { page = 1, limit = 10, search } = query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { ...where, is_active: true },
      skip,
      take: parseInt(limit),
      orderBy: { updated_at: 'desc' },
      include: {
        _count: {
          select: { sub_projects: true },
        },
      },
    }),
    prisma.project.count({ where: { ...where, is_active: true } }),
  ])

  return {
    data: projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  }
}

export async function createProject(data: any) {
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
    },
  })
}
```

#### 5.3.4 CI/CD 流程 (自动部署到 Vercel)

**GitHub Actions 配置 (.github/workflows/deploy.yml)**:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          POSTGRES_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run unit tests
        run: npm run test
        env:
          POSTGRES_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run e2e tests
        run: npm run test:e2e
        env:
          POSTGRES_URL: postgresql://postgres:postgres@localhost:5432/test_db

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build application
        run: npm run build
        env:
          POSTGRES_URL: ${{ secrets.POSTGRES_URL }}

      - name: Deploy to Vercel
        uses: vercel/vercel-actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-args: '--prod'
```

**本地开发命令**:

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 初始化数据库
npx prisma migrate dev

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览
npm run preview
```

## 6. 数据流设计

### 6.1 状态管理流程

```mermaid
graph TD
    A[用户操作] --> B[Vue组件]
    B --> C[Pinia Store]
    C --> D[Axios API调用]
    D --> E[NestJS Controller]
    E --> F[NestJS Service]
    F --> G[Prisma ORM]
    G --> H[PostgreSQL]
    H --> G
    G --> F
    F --> E
    E --> D
    D --> C
    C --> B
    B --> I[UI更新]
```

### 6.2 时效性数据处理

```mermaid
graph LR
    A[用户输入天数] --> B[前端验证]
    B --> C[NestJS API请求]
    C --> D[Prisma Service]
    D --> E[数据库触发器]
    E --> F[自动计算到期日期]
    F --> G[存储到数据库]
    G --> H[前端显示状态颜色]
```

## 7. 测试策略

### 7.1 单元测试

- **工具**: Vitest + Vue Test Utils
- **覆盖范围**:
  - 工具函数（日期处理、验证等）
  - Pinia Store 逻辑
  - 组件渲染和交互

### 7.2 集成测试

- **工具**: Playwright
- **测试场景**:
  - 项目创建到删除的完整流程
  - 子项目内容管理流程
  - 时效性内容的状态变化

### 7.3 性能测试

- **指标**:
  - 首屏加载时间 < 2 秒
  - API 响应时间 < 500ms
  - 移动端 Lighthouse 评分 > 90

## 8. 项目里程碑

### Phase 1: 基础功能开发 (2 周)

- [x] 项目管理 CRUD
- [x] 子项目管理
- [x] 基础内容类型
- [x] 数据库设计和部署

### Phase 2: 高级功能 (1 周)

- [ ] 动态内容类型
- [ ] 文字口令管理
- [ ] 时效性处理
- [ ] 搜索和筛选

### Phase 3: 优化和完善 (1 周)

- [ ] 移动端适配优化
- [ ] 性能优化
- [ ] 测试完善
- [ ] 文档完善

## 9. 风险评估

### 9.1 技术风险

| 风险                  | 影响 | 概率 | 缓解措施             |
| --------------------- | ---- | ---- | -------------------- |
| 服务器性能瓶颈        | 中   | 中   | 负载均衡、水平扩展   |
| PostgreSQL 连接数限制 | 高   | 中   | 连接池优化、监控告警 |
| 单点故障风险          | 高   | 低   | 多实例部署、容灾设计 |
| 移动端兼容性          | 中   | 低   | 充分测试、渐进增强   |
| 服务器运维成本        | 中   | 中   | Docker化、自动化部署 |

### 9.2 业务风险

| 风险         | 影响 | 概率 | 缓解措施               |
| ------------ | ---- | ---- | ---------------------- |
| 需求变更频繁 | 中   | 中   | 灵活架构设计，快速迭代 |
| 数据丢失     | 高   | 低   | 备份策略，软删除机制   |
| 用户接受度低 | 高   | 低   | 用户调研，快速反馈     |

## 10. 后续规划

### 10.1 功能扩展

- **用户权限管理**: 多用户协作，权限控制
- **数据统计**: 使用情况分析，效果统计
- **API 开放**: 支持第三方集成
- **移动应用**: 原生移动端应用

### 10.2 技术优化

- **缓存策略**: Redis 缓存，提升性能
- **CDN 加速**: 静态资源优化
- **微服务架构**: 服务拆分，独立部署
- **监控告警**: 系统监控，问题预警

---

**文档版本**: v1.0  
**创建时间**: 2024 年  
**负责人**: 全栈开发专家  
**更新记录**:

- v1.0: 初始版本，完整 PRD 设计
