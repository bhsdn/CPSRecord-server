# Repository Guidelines

## 项目结构与模块组织

- `src/` 包含主要 NestJS 逻辑：`modules/` 存放项目、子项目、内容等领域模块，每个模块以服务、控制器、DTO 组成；`common/` 放共享拦截器与常量；`config/` 管理配置提供者；`types/` 收录声明。
- `prisma/` 提供 `schema.prisma`、迁移与 `seed.ts`，用于维护数据库结构。
- `docs/` 与生成的 OpenAPI 文档对应；发布 API 变更时同步更新。
- 构建输出位于 `dist/`，请勿手动修改。

## 构建、测试与开发命令

- `npm install` 安装依赖。
- `npm run start:dev` 启动热重载开发服务器（http://localhost:3000/api）。
- `npm run prisma:generate` / `npm run prisma:migrate` 同步 Prisma Client 与数据库。
- `npm run build` 编译 TypeScript；`npm run start` 使用编译产物运行。
- `npm run export:openapi` 更新 `docs/` 下的 OpenAPI 描述。
- `npm run seed` 写入基础数据（需确保数据库干净）。

## 编码风格与命名约定

- 统一使用 TypeScript + Prettier，默认 2 空格缩进；提交前执行 `npm run format && npm run lint`。
- 模块目录与文件使用 `kebab-case`（如 `text-commands`），DTO、服务、控制器遵循 NestJS PascalCase 类名。
- 路径别名 `@/*` 指向 `src/*`，导入顺序为：第三方模块→内部别名→相对路径。
- 严格开启 `strict` 与装饰器选项，请在 DTO 中结合 `class-validator` 定义约束。

## 测试指南

- 项目预设 Jest/ts-jest，可在 `src/**/?(*.)spec.ts` 中编写单元测试，使用 `npm test` 运行（请替换现有占位脚本）。
- HTTP 集成场景建议配合 Supertest，建立 `test/` 目录或模块级 `__tests__`。
- 提交前构建并执行数据库迁移回滚，确保测试数据隔离。

## 提交与 Pull Request 规范

- 遵循 Git 历史中的祈使句风格，例如 `Add project status filter`，必须要追加中文说明；一类变更对应一次提交。
- PR 需包含：变更摘要、关联需求/Issue、数据库变化与回滚说明、必要时附上 Swagger 截图或导出文件。
- 变更影响文档时，请同步更新 `README.md` 与 `docs/`，并附执行过的关键命令。
