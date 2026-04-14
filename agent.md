# CSR Magic — 项目导航地图

## 项目概述

CSR Magic 是一个银行 CSR（企业社会责任）活动管理平台，提供两部分功能：
- **员工端（Employee Web App）**：浏览和参与 CSR 活动、AI 对话报名、AI 海报生成
- **管理端（Admin Dashboard）**：管理事件/活动、审核参与记录、数据看板、用户管理

本项目非银行内部正式应用，需适配桌面端和移动端浏览器。

## 架构总览

```
┌──────────────────────────────────────────────┐
│    csr_magic_frontend (Vite + React 19)       │
│    员工端 Web App  +  管理端 Dashboard         │
│    Port: 3000                                 │
└───────────────┬──────────────────────────────┘
                │ REST API /api/v2/*
                ▼
┌──────────────────────────────────────────────┐
│    csr_magic_backend (Spring Boot 3.4)        │
│    Auth / Event / Activity / User / Notify    │
│    Port: 8080                                 │
└──────┬──────────────┬────────────────────────┘
       │              │ HTTP
       ▼              ▼
┌─────────────┐  ┌───────────────────────────┐
│ PostgreSQL16 │  │ csr_ai_service (FastAPI)   │
│              │  │ Qwen + Wan 2.7 Image Pro   │
└─────────────┘  │ Port: 8000                  │
                 └───────────────────────────┘
```

## 技术栈速览

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | Vite + React | 19 |
| 前端语言 | TypeScript | 5.x |
| UI 框架 | TailwindCSS + Lucide + Recharts | - |
| 状态管理 | Zustand | - |
| 表单验证 | React Hook Form + Zod | - |
| 后端框架 | Spring Boot | 3.4 |
| 后端语言 | Java | 21+ |
| ORM | Spring Data JPA / Hibernate | - |
| 数据库 | PostgreSQL | 16 |
| 数据库迁移 | Flyway | - |
| AI 框架 | FastAPI + Pydantic v2 | Python 3.11+ |
| AI 模型（对话） | Qwen（通义千问）via DashScope | - |
| AI 模型（图像） | Wan 2.7 Image Pro（通义万相）via DashScope | - |
| 认证 | Spring Security + JWT | - |

## 模块索引

| 模块 | 路径 | 功能数 | 说明 |
|------|------|--------|------|
| auth | `docs/modules/auth/` | 2 | 登录/注册、JWT 认证 |
| event | `docs/modules/event/` | 1 | 事件 CRUD |
| activity | `docs/modules/activity/` | 4 | 活动列表、详情+报名、CRUD（管理端）、模板系统 |
| participation | `docs/modules/participation/` | 1 | 报名/退出 |
| dashboard | `docs/modules/dashboard/` | 1 | 统计看板 |
| notification | `docs/modules/notification/` | 1 | 站内通知系统 |
| user-management | `docs/modules/user-management/` | 1 | 用户 CRUD + 角色 |
| user-profile | `docs/modules/user-profile/` | 2 | 个人设置、我的参与记录 |
| ai-poster | `docs/modules/ai-poster/` | 2 | 海报工作台、海报画廊 |
| ai-chat-registration | `docs/modules/ai-chat-registration/` | 2 | 对话界面、Agent 对话流程 |

## 服务目录结构

```
d:\windsurf_workspaces4\
├── .windsurfrules                  # 全局规则
├── agent.md                        # 本文件
├── docs/
│   ├── shared/                     # 跨模块共享知识
│   ├── exemplar/                   # 参考实现样本
│   ├── modules/                    # 按模块→功能细分
│   └── reference/                  # 原始参考文档（只读）
├── UI_UX_prototype/                # UI/UX 原型（Vite + React，Port 3001）— 前端交互设计权威参考
├── csr_magic_frontend/             # Vite + React 19 + TypeScript
├── csr_magic_backend/              # Spring Boot 3.4 + Maven + JPA
└── csr_ai_service/                 # Python FastAPI + DashScope
```

## 前端路由

**员工端**：
| 路由　　　　　　　　　 | 页面　　　　　　　　　　　　|
| ------------------------| -----------------------------|
| `/login`　　　　　　　 | 登录　　　　　　　　　　　　|
| `/register`　　　　　　| 注册　　　　　　　　　　　　|
| `/`　　　　　　　　　　| 首页（活动动态 + 个人统计） |
| `/activities`　　　　　| 活动列表　　　　　　　　　　|
| `/activities/:id`　　　| 活动详情 + 报名　　　　　　 |
| `/activities/:id/chat` | AI 对话报名　　　　　　　　 |
| `/my`　　　　　　　　　| 个人中心（参与记录 + 设置） |
| `/poster`　　　　　　　| AI 海报工作台　　　　　　　 |

**管理端**：
| 路由 | 页面 |
|------|------|
| `/admin` | 数据看板 |
| `/admin/events` | 事件管理 |
| `/admin/activities` | 活动管理 |
| `/admin/participations` | 参与明细 + 审核 |
| `/admin/users` | 用户管理 |
| `/admin/notifications` | 通知管理 |

## 关键设计决策

| 决策 | 方案 | 原因 |
|------|------|------|
| 认证方案 | JWT Access Token + httpOnly Refresh Token | 安全性 + 无状态 |
| 文件存储 | 本地 StaticFiles（MVP）→ OSS/MinIO（后续） | 渐进式演进 |
| AI 模型 | 阿里云 DashScope API（Qwen + Wan 2.7） | 统一平台、中文优化 |
| 前端状态 | Zustand（全局）+ React Query（服务端状态） | 轻量 + 缓存 |
| 数据库迁移 | Flyway | 版本化管理 |
| API 风格 | RESTful JSON，`/api/v2/` 前缀 | 统一规范 |
| 活动模板 | 5 种模板（基础/捐赠/志愿者/签到/自定义） | 覆盖主要场景 |
| 响应式断点 | `md`（768px）为主断点 | Desktop-First + Mobile-Ready |

## 架构决策记录（Decision Log）

> 工程师实现功能时做的重要技术决策记录于此，供后续功能参考，避免冲突。

| 日期 | 功能 | 决策 | 原因 |
|------|------|------|------|
| 2026-04-12 | auth/login-register | 前后端项目从零搭建，后端 Spring Boot 3.4 + JWT(jjwt 0.12.6)，前端 Vite 6 + React 19 + TailwindCSS 4 | 首个功能实现，建立项目脚手架 |
| 2026-04-12 | auth/login-register | Token 存储使用 localStorage（accessToken + refreshToken + user JSON） | MVP 阶段简化方案，后续可迁移到 httpOnly cookie |
| 2026-04-12 | auth/login-register | 登录页遵循 UI 原型居中卡片布局，但增加了用户名/密码表单（原型仅展示角色选择按钮） | 原型为演示用，实际需要完整登录表单 |
| 2026-04-12 | auth/jwt-auth | JwtAuthFilter 检查 Token 黑名单（PostgreSQL token_blacklist 表），登出时将 jti 加入黑名单 | Phase 4 迁移 Redis，当前 MVP 用 DB |
| 2026-04-12 | auth/jwt-auth | Refresh Token 通过 X-Refresh-Token 请求头传递（兼容 localStorage 方案），优先从 cookie 读取 | 兼容 MVP localStorage + 未来 httpOnly cookie |
| 2026-04-12 | auth/jwt-auth | 前端 Axios 拦截器使用独立 refreshClient 实例发送刷新请求，避免循环拦截 + 并发队列处理 | 防止多请求同时触发 refresh |
| 2026-04-12 | auth/jwt-auth | logout 端点放入 SecurityConfig permitAll 列表，Controller 自行处理 Token 无效场景 | Token 过期后用户仍需能调用 logout，不应被 Security 层拦截 |
| 2026-04-12 | auth/jwt-auth | 前端 logout/refresh 等认证相关 API 必须使用独立 axios 实例 + 显式传 Token，禁止依赖 apiClient 拦截器隐式附加 | 拦截器依赖 localStorage 读 Token，但 Token 可能已被其他流程（如 401 拦截器 clearAuth）清除 |
| 2026-04-12 | event/event-crud | GlobalExceptionHandler 改为动态 HTTP 状态码（BusinessException.code 直接映射 HTTP status），不再固定 400 | 支持 404 等非 400 业务异常正确返回对应 HTTP 状态码 |
| 2026-04-12 | event/event-crud | EventController 使用 @PreAuthorize("hasRole('ADMIN')") 限制权限，不依赖 URL 模式匹配 | 灵活、声明式、可审计 |
| 2026-04-12 | event/event-crud | 前端管理端采用 AdminLayout（固定侧边栏 + Outlet），路由嵌套在 /admin 下 | 统一管理端布局，后续模块复用 |
| 2026-04-13 | activity/activity-crud | ActivityController GET 列表端点不加 @PreAuthorize（员工端也需访问），仅 POST/PUT/DELETE 加 ADMIN 权限 | 列表和详情需员工端可见，写操作限管理员 |
| 2026-04-13 | activity/activity-crud | ActivityRepository 使用 @Query 组合筛选（eventId + status + keyword），避免多个单条件方法组合 | 一次查询支持多维筛选，简化 Service 层逻辑 |
| 2026-04-13 | activity/activity-crud | ActivityResponse 包含 eventName 和 currentParticipants 字段，减少前端额外请求 | 列表页直接展示所属事件名和参与人数，无需 N+1 查询 |
| 2026-04-13 | activity/activity-list | ActivityRepository.findByFilters 改为 nativeQuery + CAST(:param AS TEXT) 模式 | Hibernate 6 + PostgreSQL 无法推断 null 参数的枚举/字符串类型，JPQL 的 CAST(field AS string) 也不兼容 |
| 2026-04-13 | activity/activity-list | authStore 初始化时同步从 localStorage 读取 token（loadInitialAuth 函数） | PrivateRoute 在首次渲染时检查 isAuthenticated，异步 loadFromStorage 来不及执行导致重定向到 /login |
| 2026-04-13 | infra/e2e-testing | E2E 测试从 Playwright MCP 手动交互改为本地 Playwright CLI（npx playwright test） | 可重复、可 CI、无手动步骤。创建了 e2e-test Skill 标准化流程 |
| 2026-04-13 | infra/e2e-testing | globalSetup 使用 API 方式（fetch 调用后端）获取 token，而非 UI 方式（page.fill + click） | react-hook-form 的 fill() 可能不触发 React onChange 事件，导致表单验证不通过 |
| 2026-04-13 | infra/e2e-testing | Playwright 配置使用 channel: 'msedge' 复用系统浏览器 | 避免下载 Chromium（~180MB，国内 CDN 慢），Windows 自带 Edge |
| 2026-04-13 | activity/activity-detail | ActivityController.getById 改为返回 ActivityDetailResponse（含 currentUserParticipation），从 SecurityContextHolder 获取当前用户 ID | 详情页需展示当前用户参与状态，无需额外 API 调用 |
| 2026-04-13 | activity/activity-detail | 提前创建 participation 包（entity/repository/service/controller）实现 signup/withdraw | activity-detail 功能依赖报名/退出能力，最小化实现后续 participation 模块可扩展 |
| 2026-04-13 | activity/activity-detail | user_activity 表添加 UNIQUE(user_id, activity_id) 索引 | 防止同一用户重复报名同一活动 |
| 2026-04-13 | user-profile/my-participations | 贡献统计通过 native query 聚合：志愿时长=VOLUNTEER 活动时长，捐赠=DONATION 表单 amount 字段 | 数据库无显式统计列，基于现有 template_type + form_data 推算 |
| 2026-04-13 | user-profile/my-participations | MyProfilePage 改为 Tab 页面（个人设置/参与记录/我的海报），Tab 切换不刷新页面 | 个人中心整合所有子功能，遵循 spec 交互要求 |
| 2026-04-13 | user-profile/my-participations | CSV 导出在前端生成（BOM + UTF-8），无需后端端点 | MVP 简化方案，数据量小（单用户记录），避免额外 API |
| 2026-04-13 | participation/signup | 管理端 adminList 使用 JPQL JOIN FETCH + 多维筛选（eventId/activityId/userId/state/keyword） | 一次查询加载 user+activity+reviewedBy，避免 N+1；countQuery 不含 FETCH |
| 2026-04-13 | participation/signup | withdraw 限制仅 PENDING 状态可退出（spec 要求） | 已审核记录不可撤回，保护数据完整性 |
| 2026-04-13 | participation/signup | 审核时自动发送站内通知（NotificationService.send） | 最小化实现 notification 基础设施（Entity+Repository+Service+V6迁移），完整通知模块后续扩展 |
| 2026-04-13 | participation/signup | ParticipationPage 桌面端用 Fragment 包裹行组（主行+展开详情行），移动端用卡片+展开 | 响应式适配：md: 断点切换表格/卡片布局 |
| 2026-04-13 | participation/signup | ReviewRequest 使用 record + 内部 Action 枚举（APPROVE/REJECT） | 类型安全，驳回时强制 rejectReason 非空校验 |
