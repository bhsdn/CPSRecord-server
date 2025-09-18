# CPS 推广项目内容管理系统 - 技术实现设计文档

## 1. 项目概述

### 1.1 系统定位

基于 Vue3 + TypeScript + Element Plus 技术栈的 CPS 推广项目内容管理系统，采用前后端分离架构，前端使用 Vite 构建，后端使用 NestJS + PostgreSQL，支持移动端优先的响应式设计。

### 1.2 核心价值

- 统一管理多个 CPS 推广项目及其子项目
- 动态配置内容类型，适应不同推广场景
- 自动化处理时效性内容，减少人工维护
- 提供直观的移动端友好界面

### 1.3 技术架构选型

```mermaid
graph TB
    subgraph "前端层"
        A[Vue 3 + TypeScript]
        B[Element Plus UI]
        C[Pinia 状态管理]
        D[Vue Router 路由]
        E[Tailwind CSS 样式]
    end

    subgraph "构建工具"
        F[Vite 开发服务器]
        G[Vercel 部署平台]
    end

    subgraph "后端层"
        H[NestJS 框架]
        I[Prisma ORM]
        J[TypeScript 类型安全]
    end

    subgraph "数据层"
        K[PostgreSQL 数据库]
        L[EAV 动态内容模型]
    end

    A --> H
    H --> K
    F --> G
    I --> K
```

## 2. 前端架构设计

### 2.1 项目结构设计

```
src/
├── components/              # 可复用组件
│   ├── common/             # 通用组件
│   │   ├── AppHeader.vue
│   │   ├── LoadingSpinner.vue
│   │   └── ConfirmDialog.vue
│   ├── project/            # 项目相关组件
│   │   ├── ProjectCard.vue
│   │   ├── ProjectForm.vue
│   │   └── ProjectSearch.vue
│   ├── subproject/         # 子项目组件
│   │   ├── SubProjectList.vue
│   │   ├── SubProjectForm.vue
│   │   └── SubProjectSort.vue
│   └── content/            # 内容管理组件
│       ├── ContentEditor.vue
│       ├── ContentTypeManager.vue
│       ├── TextCommandList.vue
│       └── ExpiryStatus.vue
├── views/                  # 页面组件
│   ├── ProjectList.vue
│   ├── ProjectDetail.vue
│   ├── SubProjectDetail.vue
│   └── ContentManagement.vue
├── stores/                 # Pinia状态管理
│   ├── projects.ts
│   ├── subProjects.ts
│   ├── contents.ts
│   └── app.ts
├── composables/            # 组合式函数
│   ├── useProjects.ts
│   ├── useSubProjects.ts
│   ├── useContents.ts
│   ├── useDateFormat.ts
│   └── useResponsive.ts
├── utils/                  # 工具函数
│   ├── api.ts
│   ├── date.ts
│   ├── validation.ts
│   └── constants.ts
├── types/                  # TypeScript类型定义
│   ├── project.ts
│   ├── content.ts
│   └── api.ts
└── router/                 # 路由配置
    └── index.ts
```

### 2.2 核心类型定义

```typescript
// types/project.ts
export interface Project {
  id: number;
  name: string;
  description?: string;
  subProjectCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SubProject {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  sortOrder: number;
  contents: SubProjectContent[];
  textCommands: TextCommand[];
  createdAt: string;
  updatedAt: string;
}

// types/content.ts
export interface ContentType {
  id: number;
  name: string;
  fieldType: "text" | "url" | "image" | "date" | "number";
  hasExpiry: boolean;
  isSystem: boolean;
}

export interface SubProjectContent {
  id: number;
  subProjectId: number;
  contentType: ContentType;
  contentValue: string;
  expiryDays?: number;
  expiryDate?: string;
  expiryStatus?: "safe" | "warning" | "danger";
}

export interface TextCommand {
  id: number;
  subProjectId: number;
  commandText: string;
  expiryDays: number;
  expiryDate: string;
  expiryStatus: "safe" | "warning" | "danger";
}
```

### 2.3 状态管理设计

```typescript
// stores/projects.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Project } from "@/types/project";

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");

  const filteredProjects = computed(() => {
    if (!searchQuery.value) return projects.value;
    return projects.value.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        project.description
          ?.toLowerCase()
          .includes(searchQuery.value.toLowerCase())
    );
  });

  const fetchProjects = async () => {
    loading.value = true;
    try {
      const response = await api.get("/projects");
      projects.value = response.data;
    } catch (error) {
      ElMessage.error("获取项目列表失败");
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await api.post("/projects", projectData);
      projects.value.unshift(response.data);
      ElMessage.success("项目创建成功");
      return response.data;
    } catch (error) {
      ElMessage.error("项目创建失败");
      throw error;
    }
  };

  const updateProject = async (id: number, projectData: Partial<Project>) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = response.data;
      }
      ElMessage.success("项目更新成功");
      return response.data;
    } catch (error) {
      ElMessage.error("项目更新失败");
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      projects.value = projects.value.filter((p) => p.id !== id);
      ElMessage.success("项目删除成功");
    } catch (error) {
      ElMessage.error("项目删除失败");
      throw error;
    }
  };

  return {
    projects,
    loading,
    searchQuery,
    filteredProjects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
});
```

### 2.4 组合式函数设计

```typescript
// composables/useDateFormat.ts
import { computed } from "vue";

export function useDateFormat() {
  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "danger"; // 已过期
    if (diffDays <= 3) return "danger"; // 3天内到期
    if (diffDays <= 7) return "warning"; // 7天内到期
    return "safe"; // 安全期
  };

  const getExpiryText = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return `已过期${Math.abs(diffDays)}天`;
    if (diffDays === 0) return "今天到期";
    if (diffDays === 1) return "明天到期";
    return `${diffDays}天后到期`;
  };

  return {
    formatDate,
    getExpiryStatus,
    getExpiryText,
  };
}

// composables/useResponsive.ts
import { ref, onMounted, onUnmounted } from "vue";

export function useResponsive() {
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);

  const updateBreakpoint = () => {
    const width = window.innerWidth;
    isMobile.value = width < 768;
    isTablet.value = width >= 768 && width < 1024;
    isDesktop.value = width >= 1024;
  };

  onMounted(() => {
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateBreakpoint);
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
```

### 2.5 路由设计

```typescript
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/projects",
  },
  {
    path: "/projects",
    name: "ProjectList",
    component: () => import("@/views/ProjectList.vue"),
    meta: {
      title: "项目管理",
      keepAlive: true,
    },
  },
  {
    path: "/projects/:id",
    name: "ProjectDetail",
    component: () => import("@/views/ProjectDetail.vue"),
    meta: {
      title: "项目详情",
    },
  },
  {
    path: "/projects/:projectId/subprojects/:id",
    name: "SubProjectDetail",
    component: () => import("@/views/SubProjectDetail.vue"),
    meta: {
      title: "子项目管理",
    },
  },
  {
    path: "/content-types",
    name: "ContentManagement",
    component: () => import("@/views/ContentManagement.vue"),
    meta: {
      title: "内容类型管理",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - CPS推广管理系统`;
  }
  next();
});

export default router;
```

## 3. 核心组件设计

### 3.1 项目卡片组件

```vue
<!-- components/project/ProjectCard.vue -->
<template>
  <el-card
    class="project-card cursor-pointer hover:shadow-lg transition-shadow"
    @click="handleClick"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold truncate">{{ project.name }}</h3>
        <el-dropdown @command="handleCommand" trigger="click" @click.stop>
          <el-button type="text" size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>

    <div class="space-y-3">
      <p class="text-gray-600 text-sm line-clamp-2">
        {{ project.description || "暂无描述" }}
      </p>

      <div class="flex justify-between text-sm text-gray-500">
        <span>{{ project.subProjectCount }} 个子项目</span>
        <span>{{ formatDate(project.updatedAt) }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Project } from "@/types/project";
import { useDateFormat } from "@/composables/useDateFormat";

interface Props {
  project: Project;
}

interface Emits {
  (e: "click", project: Project): void;
  (e: "edit", project: Project): void;
  (e: "delete", project: Project): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { formatDate } = useDateFormat();

const handleClick = () => {
  emit("click", props.project);
};

const handleCommand = (command: string) => {
  switch (command) {
    case "edit":
      emit("edit", props.project);
      break;
    case "delete":
      emit("delete", props.project);
      break;
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

### 3.2 过期状态组件

```vue
<!-- components/content/ExpiryStatus.vue -->
<template>
  <el-tag :type="tagType" :size="size" class="expiry-status">
    <el-icon class="mr-1">
      <Clock v-if="status === 'safe'" />
      <Warning v-else-if="status === 'warning'" />
      <Close v-else />
    </el-icon>
    {{ expiryText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDateFormat } from "@/composables/useDateFormat";

interface Props {
  expiryDate: string;
  size?: "large" | "default" | "small";
}

const props = withDefaults(defineProps<Props>(), {
  size: "default",
});

const { getExpiryStatus, getExpiryText } = useDateFormat();

const status = computed(() => getExpiryStatus(props.expiryDate));
const expiryText = computed(() => getExpiryText(props.expiryDate));

const tagType = computed(() => {
  switch (status.value) {
    case "safe":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "info";
  }
});
</script>
```

### 3.3 内容编辑器组件

```vue
<!-- components/content/ContentEditor.vue -->
<template>
  <div class="content-editor">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="内容类型" prop="contentTypeId">
        <el-select
          v-model="formData.contentTypeId"
          placeholder="选择内容类型"
          class="w-full"
          @change="handleContentTypeChange"
        >
          <el-option
            v-for="type in contentTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="selectedContentType?.name || '内容'"
        prop="contentValue"
      >
        <!-- 文本类型 -->
        <el-input
          v-if="selectedContentType?.fieldType === 'text'"
          v-model="formData.contentValue"
          type="textarea"
          :rows="3"
          placeholder="请输入内容"
        />

        <!-- URL类型 -->
        <el-input
          v-else-if="selectedContentType?.fieldType === 'url'"
          v-model="formData.contentValue"
          placeholder="请输入URL"
        />

        <!-- 图片类型 -->
        <el-upload
          v-else-if="selectedContentType?.fieldType === 'image'"
          class="w-full"
          :action="uploadUrl"
          :show-file-list="false"
          :on-success="handleImageSuccess"
          :before-upload="beforeImageUpload"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            上传图片
          </el-button>
          <div v-if="formData.contentValue" class="mt-2">
            <el-image
              :src="formData.contentValue"
              class="w-20 h-20"
              fit="cover"
            />
          </div>
        </el-upload>
      </el-form-item>

      <!-- 时效性设置 -->
      <el-form-item
        v-if="selectedContentType?.hasExpiry"
        label="有效天数"
        prop="expiryDays"
      >
        <el-input-number
          v-model="formData.expiryDays"
          :min="1"
          :max="365"
          placeholder="请输入有效天数"
        />
        <div class="text-sm text-gray-500 mt-1">
          到期时间：{{ calculatedExpiryDate }}
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">
          {{ isEdit ? "更新" : "保存" }}
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ContentType, SubProjectContent } from "@/types/content";

interface Props {
  contentTypes: ContentType[];
  modelValue?: SubProjectContent;
  isEdit?: boolean;
}

interface Emits {
  (e: "submit", data: any): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
});

const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const formData = ref({
  contentTypeId: undefined as number | undefined,
  contentValue: "",
  expiryDays: undefined as number | undefined,
});

const selectedContentType = computed(() => {
  return props.contentTypes.find(
    (type) => type.id === formData.value.contentTypeId
  );
});

const calculatedExpiryDate = computed(() => {
  if (!formData.value.expiryDays) return "";
  const date = new Date();
  date.setDate(date.getDate() + formData.value.expiryDays);
  return date.toLocaleDateString("zh-CN");
});

const rules: FormRules = {
  contentTypeId: [
    { required: true, message: "请选择内容类型", trigger: "change" },
  ],
  contentValue: [{ required: true, message: "请输入内容", trigger: "blur" }],
  expiryDays: [{ required: true, message: "请输入有效天数", trigger: "blur" }],
};

const uploadUrl = "/api/upload";

// 监听编辑数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formData.value = {
        contentTypeId: newValue.contentType.id,
        contentValue: newValue.contentValue,
        expiryDays: newValue.expiryDays,
      };
    }
  },
  { immediate: true }
);

const handleContentTypeChange = () => {
  formData.value.contentValue = "";
  formData.value.expiryDays = undefined;
};

const handleImageSuccess = (response: any) => {
  formData.value.contentValue = response.url;
};

const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传图片文件");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过2MB");
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate();
  if (!valid) return;

  emit("submit", { ...formData.value });
};

const handleCancel = () => {
  emit("cancel");
};
</script>
```

## 4. 后端架构设计

### 4.1 NestJS 项目结构

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
│   │   │       ├── update-project.dto.ts
│   │   │       └── query-project.dto.ts
│   │   ├── sub-projects/
│   │   │   ├── sub-projects.controller.ts
│   │   │   ├── sub-projects.service.ts
│   │   │   ├── sub-projects.module.ts
│   │   │   └── dto/
│   │   ├── contents/
│   │   │   ├── contents.controller.ts
│   │   │   ├── contents.service.ts
│   │   │   ├── contents.module.ts
│   │   │   └── dto/
│   │   ├── text-commands/
│   │   │   ├── text-commands.controller.ts
│   │   │   ├── text-commands.service.ts
│   │   │   ├── text-commands.module.ts
│   │   │   └── dto/
│   │   └── content-types/
│   │       ├── content-types.controller.ts
│   │       ├── content-types.service.ts
│   │       ├── content-types.module.ts
│   │       └── dto/
│   ├── common/
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── decorators/
│   │   │   └── api-response.decorator.ts
│   │   └── utils/
│   │       ├── date.util.ts
│   │       └── response.util.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   └── swagger.config.ts
│   └── types/
│       └── api.types.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── test/
├── package.json
├── nest-cli.json
└── tsconfig.json
```

### 4.2 数据库模型设计

```prisma
// prisma/schema.prisma
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

  project      Project               @relation(fields: [projectId], references: [id])
  contents     SubProjectContent[]
  textCommands TextCommand[]

  @@map("sub_projects")
  @@index([projectId])
}

model ContentType {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(100)
  fieldType String   @map("field_type") @db.VarChar(50)
  hasExpiry Boolean  @default(false) @map("has_expiry")
  isSystem  Boolean  @default(false) @map("is_system")
  createdAt DateTime @default(now()) @map("created_at")

  contents SubProjectContent[]

  @@map("content_types")
}

model SubProjectContent {
  id            Int      @id @default(autoincrement())
  subProjectId  Int      @map("sub_project_id")
  contentTypeId Int      @map("content_type_id")
  contentValue  String?  @map("content_value")
  expiryDays    Int?     @map("expiry_days")
  expiryDate    DateTime? @map("expiry_date") @db.Date
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  isActive      Boolean  @default(true) @map("is_active")

  subProject  SubProject  @relation(fields: [subProjectId], references: [id])
  contentType ContentType @relation(fields: [contentTypeId], references: [id])

  @@unique([subProjectId, contentTypeId])
  @@map("sub_project_contents")
  @@index([subProjectId])
}

model TextCommand {
  id           Int      @id @default(autoincrement())
  subProjectId Int      @map("sub_project_id")
  commandText  String   @map("command_text")
  expiryDays   Int      @map("expiry_days")
  expiryDate   DateTime @map("expiry_date") @db.Date
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  isActive     Boolean  @default(true) @map("is_active")

  subProject SubProject @relation(fields: [subProjectId], references: [id])

  @@map("text_commands")
  @@index([subProjectId])
  @@index([expiryDate])
}
```

### 4.3 API 控制器设计

```typescript
// modules/projects/projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from "./dto";
import { ResponseInterceptor } from "@/common/interceptors/response.interceptor";
import { ApiResponseWrapper } from "@/common/decorators/api-response.decorator";

@ApiTags("项目管理")
@Controller("api/projects")
@UseInterceptors(ResponseInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: "获取项目列表" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "页码",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "每页数量",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "搜索关键词",
  })
  @ApiResponseWrapper({
    status: HttpStatus.OK,
    description: "获取项目列表成功",
    type: "array",
  })
  async findAll(@Query() query: QueryProjectDto) {
    return await this.projectsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取项目详情" })
  @ApiResponseWrapper({
    status: HttpStatus.OK,
    description: "获取项目详情成功",
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "创建项目" })
  @ApiResponseWrapper({
    status: HttpStatus.CREATED,
    description: "创建项目成功",
  })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return await this.projectsService.create(createProjectDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "更新项目" })
  @ApiResponseWrapper({
    status: HttpStatus.OK,
    description: "更新项目成功",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return await this.projectsService.update(id, updateProjectDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除项目" })
  @ApiResponseWrapper({
    status: HttpStatus.OK,
    description: "删除项目成功",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.projectsService.remove(id);
  }

  @Get(":id/sub-projects")
  @ApiOperation({ summary: "获取项目的子项目列表" })
  @ApiResponseWrapper({
    status: HttpStatus.OK,
    description: "获取子项目列表成功",
    type: "array",
  })
  async getSubProjects(@Param("id", ParseIntPipe) id: number) {
    return await this.projectsService.getSubProjects(id);
  }
}
```

### 4.4 业务服务设计

```typescript
// modules/projects/projects.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/database/prisma.service";
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from "./dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProjectDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ProjectWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // 并行查询数据和总数
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { subProjects: { where: { isActive: true } } },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    // 格式化返回数据
    const formattedProjects = projects.map((project) => ({
      ...project,
      subProjectCount: project._count.subProjects,
    }));

    return {
      data: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, isActive: true },
      include: {
        subProjects: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                contents: { where: { isActive: true } },
                textCommands: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`项目 #${id} 不存在`);
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
      },
    });

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    // 检查项目是否存在
    await this.findOne(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
      },
    });

    return project;
  }

  async remove(id: number) {
    // 检查项目是否存在
    await this.findOne(id);

    // 软删除项目及其子项目
    await this.prisma.$transaction([
      // 软删除子项目的内容
      this.prisma.subProjectContent.updateMany({
        where: { subProject: { projectId: id } },
        data: { isActive: false },
      }),
      // 软删除子项目的文字口令
      this.prisma.textCommand.updateMany({
        where: { subProject: { projectId: id } },
        data: { isActive: false },
      }),
      // 软删除子项目
      this.prisma.subProject.updateMany({
        where: { projectId: id },
        data: { isActive: false },
      }),
      // 软删除项目
      this.prisma.project.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return { message: "项目删除成功" };
  }

  async getSubProjects(projectId: number) {
    // 检查项目是否存在
    await this.findOne(projectId);

    const subProjects = await this.prisma.subProject.findMany({
      where: { projectId, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        contents: {
          where: { isActive: true },
          include: { contentType: true },
        },
        textCommands: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return subProjects;
  }
}
```

### 4.5 DTO 数据传输对象

```typescript
// modules/projects/dto/create-project.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Length } from "class-validator";

export class CreateProjectDto {
  @ApiProperty({ description: "项目名称", example: "淘宝CPS推广" })
  @IsString({ message: "项目名称必须是字符串" })
  @Length(1, 255, { message: "项目名称长度必须在1-255个字符之间" })
  name: string;

  @ApiProperty({
    description: "项目描述",
    example: "主要推广淘宝商品，包含服装、数码等分类",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "项目描述必须是字符串" })
  @Length(0, 1000, { message: "项目描述长度不能超过1000个字符" })
  description?: string;
}

// modules/projects/dto/update-project.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// modules/projects/dto/query-project.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class QueryProjectDto {
  @ApiProperty({ description: "页码", example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "页码必须是整数" })
  @Min(1, { message: "页码必须大于0" })
  page?: number = 1;

  @ApiProperty({ description: "每页数量", example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "每页数量必须是整数" })
  @Min(1, { message: "每页数量必须大于0" })
  @Max(100, { message: "每页数量不能超过100" })
  limit?: number = 10;

  @ApiProperty({ description: "搜索关键词", required: false })
  @IsOptional()
  @IsString({ message: "搜索关键词必须是字符串" })
  search?: string;
}
```

## 5. 数据库触发器与自动化

### 5.1 自动计算到期时间

```sql
-- 创建触发器函数：自动计算到期时间
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果设置了有效天数，自动计算到期日期
    IF NEW.expiry_days IS NOT NULL THEN
        NEW.expiry_date := CURRENT_DATE + INTERVAL '1 day' * NEW.expiry_days;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 sub_project_contents 表创建触发器
CREATE TRIGGER trigger_calculate_content_expiry
    BEFORE INSERT OR UPDATE ON sub_project_contents
    FOR EACH ROW
    EXECUTE FUNCTION calculate_expiry_date();

-- 为 text_commands 表创建触发器
CREATE TRIGGER trigger_calculate_command_expiry
    BEFORE INSERT OR UPDATE ON text_commands
    FOR EACH ROW
    EXECUTE FUNCTION calculate_expiry_date();
```

### 5.2 性能优化索引

```sql
-- 项目查询优化
CREATE INDEX idx_projects_active_updated ON projects(is_active, updated_at DESC);
CREATE INDEX idx_projects_name_search ON projects USING gin(name gin_trgm_ops);

-- 子项目查询优化
CREATE INDEX idx_subprojects_project_sort ON sub_projects(project_id, sort_order) WHERE is_active = true;

-- 内容查询优化
CREATE INDEX idx_contents_subproject_active ON sub_project_contents(sub_project_id) WHERE is_active = true;
CREATE INDEX idx_contents_expiry_status ON sub_project_contents(expiry_date) WHERE expiry_date IS NOT NULL;

-- 文字口令查询优化
CREATE INDEX idx_commands_subproject_expiry ON text_commands(sub_project_id, expiry_date) WHERE is_active = true;

-- 启用 pg_trgm 扩展支持模糊搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 6. 移动端响应式设计

### 6.1 断点系统设计

```scss
// styles/breakpoints.scss
$mobile: 768px;
$tablet: 1024px;
$desktop: 1200px;

@mixin mobile {
  @media (max-width: #{$mobile - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: #{$mobile}) and (max-width: #{$tablet - 1px}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: #{$tablet}) {
    @content;
  }
}

@mixin mobile-up {
  @media (min-width: #{$mobile}) {
    @content;
  }
}
```

### 6.2 移动端布局组件

```vue
<!-- components/layout/MobileLayout.vue -->
<template>
  <div class="mobile-layout">
    <!-- 顶部导航 -->
    <header class="mobile-header">
      <div class="header-content">
        <el-button v-if="showBack" type="text" size="large" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <h1 class="header-title">{{ title }}</h1>

        <div class="header-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="mobile-main">
      <slot />
    </main>

    <!-- 底部操作栏 -->
    <footer v-if="$slots.footer" class="mobile-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

interface Props {
  title: string;
  showBack?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
});

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.mobile-header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.mobile-footer {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 12px 16px;
}
</style>
```

### 6.3 触摸优化交互

```vue
<!-- composables/useTouch.ts -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

export function useTouch(element: Ref<HTMLElement | null>) {
  const startX = ref(0);
  const startY = ref(0);
  const moveX = ref(0);
  const moveY = ref(0);
  const isSwiping = ref(false);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    isSwiping.value = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.value) {
      const touch = e.touches[0];
      moveX.value = touch.clientX - startX.value;
      moveY.value = touch.clientY - startY.value;

      // 判断是否为滑动手势
      if (Math.abs(moveX.value) > 10 || Math.abs(moveY.value) > 10) {
        isSwiping.value = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (isSwiping.value) {
      // 处理滑动结束
      const direction = getSwipeDirection();
      return { direction, distance: { x: moveX.value, y: moveY.value } };
    }
    return null;
  };

  const getSwipeDirection = () => {
    const absX = Math.abs(moveX.value);
    const absY = Math.abs(moveY.value);

    if (absX > absY) {
      return moveX.value > 0 ? "right" : "left";
    } else {
      return moveY.value > 0 ? "down" : "up";
    }
  };

  onMounted(() => {
    if (element.value) {
      element.value.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      element.value.addEventListener("touchmove", handleTouchMove, {
        passive: true,
      });
      element.value.addEventListener("touchend", handleTouchEnd, {
        passive: true,
      });
    }
  });

  onUnmounted(() => {
    if (element.value) {
      element.value.removeEventListener("touchstart", handleTouchStart);
      element.value.removeEventListener("touchmove", handleTouchMove);
      element.value.removeEventListener("touchend", handleTouchEnd);
    }
  });

  return {
    isSwiping,
    moveX,
    moveY,
    handleTouchEnd,
  };
}
</script>
```

## 7. 性能优化策略

### 7.1 前端性能优化

```typescript
// utils/performance.ts
// 虚拟滚动实现
export class VirtualScroll {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleCount: number;
  private startIndex = 0;
  private endIndex = 0;

  constructor(container: HTMLElement, itemHeight: number) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
  }

  updateVisibleRange(scrollTop: number, totalCount: number) {
    this.startIndex = Math.floor(scrollTop / this.itemHeight);
    this.endIndex = Math.min(this.startIndex + this.visibleCount, totalCount);

    return {
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      offsetY: this.startIndex * this.itemHeight,
    };
  }
}

// 图片懒加载指令
import type { Directive } from "vue";

export const vLazyload: Directive = {
  mounted(el: HTMLImageElement, binding) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = binding.value;
            img.classList.remove("lazy-loading");
            observer.unobserve(img);
          }
        });
      },
      { threshold: 0.1 }
    );

    el.classList.add("lazy-loading");
    observer.observe(el);
  },
};

// 防抖和节流工具
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout>;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}
```

### 7.2 后端缓存策略

```typescript
// common/interceptors/cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);
    const cacheTTL =
      this.reflector.get<number>("cache-ttl", context.getHandler()) || 60000; // 默认1分钟

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((response) => {
        // 缓存响应
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
          ttl: cacheTTL,
        });

        // 清理过期缓存
        this.cleanExpiredCache();
      })
    );
  }

  private generateCacheKey(request: any): string {
    return `${request.method}:${request.url}:${JSON.stringify(request.query)}`;
  }

  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 缓存装饰器
export const CacheTTL = (ttl: number) => SetMetadata("cache-ttl", ttl);
```

### 7.3 数据库查询优化

```typescript
// 批量操作优化
export class BatchOperations {
  static async batchCreateTextCommands(
    prisma: PrismaService,
    commands: Array<{
      subProjectId: number;
      commandText: string;
      expiryDays: number;
    }>
  ) {
    const data = commands.map((cmd) => ({
      ...cmd,
      expiryDate: new Date(Date.now() + cmd.expiryDays * 24 * 60 * 60 * 1000),
    }));

    return await prisma.textCommand.createMany({
      data,
      skipDuplicates: true,
    });
  }

  static async batchUpdateExpiryStatus(prisma: PrismaService) {
    const today = new Date();

    // 批量更新即将过期的内容状态
    await prisma.$executeRaw`
      UPDATE sub_project_contents 
      SET updated_at = NOW()
      WHERE expiry_date IS NOT NULL 
        AND expiry_date <= ${new Date(
          today.getTime() + 7 * 24 * 60 * 60 * 1000
        )}
        AND is_active = true
    `;
  }
}

// 分页查询优化
export class PaginationHelper {
  static async paginate<T>(
    prisma: PrismaService,
    model: string,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      page: number;
      limit: number;
    }
  ) {
    const { page, limit, where, include, orderBy } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (prisma as any)[model].findMany({
        where,
        include,
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any)[model].count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
```

## 8. 测试策略设计

### 8.1 前端测试配置

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

// src/test/setup.ts
import { config } from "@vue/test-utils";
import ElementPlus from "element-plus";

config.global.plugins = [ElementPlus];

// Mock API
global.fetch = vi.fn();

// Mock router
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useRoute: () => ({
    params: { id: "1" },
    query: {},
  }),
}));
```

### 8.2 组件单元测试

```typescript
// src/components/__tests__/ProjectCard.test.ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ProjectCard from "@/components/project/ProjectCard.vue";
import type { Project } from "@/types/project";

const mockProject: Project = {
  id: 1,
  name: "测试项目",
  description: "这是一个测试项目",
  subProjectCount: 3,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  isActive: true,
};

describe("ProjectCard", () => {
  it("renders project information correctly", () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.find("h3").text()).toBe("测试项目");
    expect(wrapper.text()).toContain("这是一个测试项目");
    expect(wrapper.text()).toContain("3 个子项目");
  });

  it("emits click event when card is clicked", async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
    expect(wrapper.emitted("click")![0]).toEqual([mockProject]);
  });

  it("emits edit event when edit action is clicked", async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    // 模拟下拉菜单操作
    const dropdown = wrapper.findComponent({ name: "ElDropdown" });
    await dropdown.vm.$emit("command", "edit");

    expect(wrapper.emitted("edit")).toBeTruthy();
    expect(wrapper.emitted("edit")![0]).toEqual([mockProject]);
  });
});
```

### 8.3 API 集成测试

```typescript
// src/test/api/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { api } from "@/utils/api";

const server = setupServer(
  rest.get("/api/projects", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          {
            id: 1,
            name: "测试项目",
            description: "测试描述",
            subProjectCount: 2,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      })
    );
  }),

  rest.post("/api/projects", (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: 2,
          name: "新项目",
          description: "新项目描述",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      })
    );
  })
);

beforeEach(() => server.listen());
afterEach(() => server.resetHandlers());

describe("Projects API", () => {
  it("fetches projects list", async () => {
    const response = await api.get("/projects");

    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveLength(1);
    expect(response.data.data[0].name).toBe("测试项目");
  });

  it("creates new project", async () => {
    const projectData = {
      name: "新项目",
      description: "新项目描述",
    };

    const response = await api.post("/projects", projectData);

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe("新项目");
  });
});
```

### 8.4 E2E 测试配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});

// e2e/project-management.spec.ts
import { test, expect } from "@playwright/test";

test.describe("项目管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("创建新项目流程", async ({ page }) => {
    // 点击新建项目按钮
    await page.click('[data-test="new-project-btn"]');

    // 填写项目信息
    await page.fill('[data-test="project-name"]', "测试项目");
    await page.fill('[data-test="project-description"]', "这是一个测试项目");

    // 提交表单
    await page.click('[data-test="submit-btn"]');

    // 验证项目创建成功
    await expect(page.locator(".el-message--success")).toBeVisible();
    await expect(page.locator('[data-test="project-card"]')).toContainText(
      "测试项目"
    );
  });

  test("项目搜索功能", async ({ page }) => {
    // 输入搜索关键词
    await page.fill('[data-test="search-input"]', "测试");

    // 等待搜索结果
    await page.waitForSelector('[data-test="project-card"]');

    // 验证搜索结果
    const projectCards = await page.locator('[data-test="project-card"]').all();
    expect(projectCards.length).toBeGreaterThan(0);
  });

  test("移动端响应式布局", async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 验证移动端布局
    await expect(page.locator(".mobile-header")).toBeVisible();
    await expect(page.locator('[data-test="project-grid"]')).toHaveCSS(
      "grid-template-columns",
      "1fr"
    );
  });
});
```

## 9. 部署与运维方案

### 9.1 Docker 容器化

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 9.2 CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
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
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci

      - name: Run frontend tests
        run: npm run test

      - name: Run backend tests
        run: |
          cd backend
          npx prisma migrate deploy
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run E2E tests
        run: |
          npm run build
          npm run test:e2e
        env:
          CI: true

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Deploy to Vercel
        uses: vercel/vercel-actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-args: "--prod"

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_REGISTRY }}/cps-backend:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_REGISTRY }}/cps-backend:latest
            docker stop cps-backend || true
            docker rm cps-backend || true
            docker run -d \
              --name cps-backend \
              --restart unless-stopped \
              -p 3000:3000 \
              -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
              -e NODE_ENV=production \
              ${{ secrets.DOCKER_REGISTRY }}/cps-backend:latest
```

### 9.3 监控与日志

```typescript
// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query } = request;
    const startTime = Date.now();

    this.logger.log(`${method} ${url} - Request started`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`${method} ${url} - Completed in ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `${method} ${url} - Failed in ${duration}ms: ${error.message}`
        );
        throw error;
      })
    );
  }
}

// 健康检查端点
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      };
    }
  }
}
```
