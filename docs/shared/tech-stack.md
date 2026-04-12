# 技术栈

> 本文档记录项目所有技术栈版本和依赖，确保团队一致。

## 前端服务（csr_magic_frontend）

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 构建工具 | Vite | 6.x | 开发服务器 + 打包 |
| 框架 | React | 19 | 函数式组件 + Hooks |
| 语言 | TypeScript | 5.x | 严格模式 |
| 样式 | TailwindCSS | 4.x | Utility-first CSS |
| 图标 | Lucide React | - | SVG 图标库 |
| 图表 | Recharts | - | 数据看板图表 |
| 状态管理 | Zustand | - | 轻量全局状态 |
| 服务端状态 | React Query (TanStack Query) | - | API 缓存 + 请求管理 |
| 表单 | React Hook Form + Zod | - | 表单验证 |
| HTTP 客户端 | Axios | - | API 调用 + 拦截器 |
| 路由 | React Router | 7.x | 客户端路由 |
| 端口 | - | 3000 | 开发服务器 |

## 后端服务（csr_magic_backend）

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Spring Boot | 3.4 | Web + Security + JPA |
| 语言 | Java | 17+ | LTS 版本 |
| 构建 | Maven | 3.9+ | 依赖管理 + 打包 |
| ORM | Spring Data JPA / Hibernate | - | 数据访问层 |
| 安全 | Spring Security + JWT | - | 认证授权 |
| 数据库 | PostgreSQL | 16 | 主数据库 |
| 迁移 | Flyway | - | 数据库版本管理 |
| 日志 | SLF4J + Logback | - | 结构化日志 |
| API 文档 | SpringDoc OpenAPI | - | Swagger UI |
| 端口 | - | 8080 | HTTP 服务 |

## AI 服务（csr_ai_service）

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | FastAPI | - | 异步 Web 框架 |
| 语言 | Python | 3.11+ | 异步支持 |
| 数据模型 | Pydantic | v2 | 请求/响应验证 |
| HTTP 客户端 | httpx | - | 异步 HTTP 调用 |
| AI 对话 | Qwen (通义千问) | - | DashScope API |
| AI 图像 | Wan 2.7 Image Pro (通义万相) | - | DashScope API |
| 图像处理 | Pillow | - | 海报合成 |
| SDK | dashscope | - | 阿里云 AI SDK |
| 端口 | - | 8000 | HTTP 服务 |

## 基础设施

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 数据库 | PostgreSQL | 16 | 主数据存储 |
| 缓存 | Redis | 7（Phase 4 引入） | Token 黑名单、热点缓存 |
| 文件存储 | 本地 StaticFiles（MVP） | - | 后续迁移至 OSS/MinIO |
| 容器化 | Docker Compose | - | 一键启动全部服务 |
