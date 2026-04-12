# CSR Activity V2 — 主计划索引

本文档是 CSR V2 的主计划索引，详细内容已拆分为两份独立文档，供设计和开发分别使用。

## 文档索引

| 文档　　　　　　 | 路径　　　　　　　　　　　　　　　 | 面向　　　　 | 内容　　　　　　　　　　　　　　　　　　 |
| ------------------| ------------------------------------| --------------| ------------------------------------------|
| **功能规格文档** | `csr-v2-functional-spec-98abc9.md` | UI/UX 设计师 | 用户角色、页面结构、交互流程、用户流程图 |
| **技术规格文档** | `csr-v2-technical-spec-98abc9.md`　| 开发工程师　 | 架构、API、数据库、AI 服务、部署　　　　 |
| **开发启动计划** | `csr-v2-kickoff-plan-98abc9.md`　　| 开发工程师　 | Phase 1 详细任务、技术选型确认、启动步骤 |

---

## 一、与 V1 的核心差异

| 维度 | V1 | V2 |
|------|----|----|
| 用户端平台 | H5 + 微信小程序（uni-app） | **桌面端 + 手机端浏览器**（响应式 Web App） |
| 移动端适配 | 仅 H5 | **✅ 全站响应式（Admin 表格→卡片 + Employee 汉堡导航）** |
| AI 能力 | 无 | **AI 个性化海报生成** |
| 完成度 | 多处 Mock 数据，API 不一致 | **全量落地，无 Mock** |
| 架构 | 单体 Spring Boot | **主服务 + Python AI 微服务** |
| 区块链 | 强依赖外部服务 | **预留接口，可选接入** |

---

## 二、功能规划

### 2.1 用户端（Desktop Web App）

| 模块 | 功能要点 |
|------|---------|
| 认证 | 登录 / 注册 / 登出；JWT 自动刷新 |
| 首页 | 活动动态 Feed；参与统计卡片 |
| 活动浏览 | 列表 + 搜索 + 筛选；活动详情页 |
| 活动参与 | 报名 / 退出；按模板填写表单（文字 / 图片上传） |
| 个人中心 | 历史参与记录；贡献统计；个人设置 |
| **AI 海报生成** | 选择活动 → 上传/选用已有照片 → 输入个人文案 → AI 生成专属海报 → 下载/分享 |

### 2.2 管理后台（Admin Dashboard）

| 模块 | 功能要点 |
|------|---------|
| 数据看板 | 活动参与总览、贡献趋势图、部门/地区分布 |
| 事件管理 | 完整 CRUD；可见范围控制（地区/角色） |
| 活动管理 | 多模板支持；状态管理；审核流程 |
| 用户管理 | 完整 CRUD；批量操作；角色/审核人配置 |
| 活动明细 | 多维筛选；审核操作；附件查看；数据导出 |
| 通知管理 | 报名确认、审核通知模板配置 |
| 区块链（可选） | 存证状态监控；补链操作 |

### 2.3 活动模板扩展（V1 仅2种）

- Template 1: 基础参与（文字记录）
- Template 2: 捐赠（金额 + 评语）
- **Template 3**: 志愿者服务（时长 + 照片打卡）
- **Template 4**: 签到打卡（地理位置 + 时间戳）
- **Template 5**: 自定义表单（管理员可配置字段）

### 2.4 AI 个性化海报（核心新功能）

**用户流程**：
1. 选择一个已参与的活动
2. 上传照片（或从活动照片库选取）
3. 填写个人感言/文案（可选，AI 也可自动生成）
4. 选择海报风格模板
5. AI 服务合成海报（背景 + 照片 + 文案 + 活动信息）
6. 预览 → 下载 PNG / 分享链接

---

## 三、技术架构

### 3.1 整体架构

```
┌──────────────────────────────────────────────┐
│      Frontend (Vite + React / csr-magic-mfe)  │
│     User Web App  +  Admin Dashboard          │
│     Port: 3000                                │
└───────────────┬──────────────────────────────┘
                │ REST API /api/v2/*
                ▼
┌──────────────────────────────────────────────┐
│     Main Backend (Spring Boot 3.4 / Maven)    │
│  Auth / Event / Activity / User / Notify      │
│  Port: 8080                                   │
└──────┬──────────────┬────────────────────────┘
       │              │ HTTP RPC
       ▼              ▼
┌─────────────┐  ┌───────────────────────────┐
│ PostgreSQL16 │  │ AI Service (Python FastAPI)│
│ Redis 7     │  │ LangChain + Qwen + ImgGen  │
└─────────────┘  │ Port: 8000                 │
                 └───────────────────────────┘
                          │ (Optional)
                          ▼
                 ┌──────────────────┐
                 │  Blockchain API  │
                 │  预留接口         │
                 └──────────────────┘
```

### 3.2 各服务技术栈

| 服务 | 技术栈 | 说明 |
|------|--------|------|
| **主后端** | Spring Boot 3.4 + Maven + JPA + PostgreSQL 16 + Redis | API、业务逻辑、认证 |
| **AI 服务** | Python 3.11 + FastAPI + LangChain | 海报生成、Qwen 对话报名 |
| **图像生成** | 通义万相 Wan 2.7 Image Pro（DashScope API） | `dashscope` SDK |
| **前端** | Vite + React 19 + TypeScript（`csr-magic-mfe`） | ✅ Phase 2 已完成 |
| **UI 框架** | TailwindCSS + Lucide + Recharts | 自然绿展示风格 |
| **文件存储** | 本地 StaticFiles（Phase 3 MVP）→ 阿里云 OSS / MinIO（Phase 4） | 海报图片当前存在 ai-service /static/posters/ |
| **缓存** | Redis | Token 黑名单当前用 PostgreSQL 实现，Phase 4 迁移至 Redis |

### 3.3 AI 服务架构（Python）✅ Phase 3 海报生成已完成

```
ai-service/                              ← 实际目录结构
├── main.py                          ✅ FastAPI 应用 + CORS + StaticFiles（/static/posters）
├── app/
│   ├── api/
│   │   └── poster.py                ✅ POST /poster/generate + GET /poster/{task_id}
│   ├── agents/
│   │   ├── poster_agent.py          ✅ 海报生成主流程（prompt → 万相 → 下载 → Pillow 合成 → 存储）
│   │   └── image_gen.py             ✅ 通义万相 Wan 2.7 Image Pro 调用封装
│   ├── utils/
│   │   ├── image_compose.py         ✅ Pillow 合成海报（背景 + 照片 + 文字叠加）
│   │   ├── prompt_builder.py        ✅ 根据活动类型构建 prompt + negative_prompt
│   │   └── storage.py               ✅ 本地文件存储（/static/posters/）
│   ├── models.py                    ✅ Pydantic 请求/响应模型
│   └── config.py                    ✅ Settings（DASHSCOPE_API_KEY 等）
├── requirements.txt                 ✅
├── .env.example                     ✅
└── .gitignore                       ✅
```

**海报生成流程（✅ 已实现）**：
1. 前端提交生成请求 → 后端 PosterService 异步代理至 AI 服务
2. `prompt_builder` 根据活动类型 + 用户风格选择构建 prompt + negative_prompt
3. 调用通义万相 Wan 2.7 Image Pro 生成背景图（返回临时 URL 24h 有效）
4. 立即下载临时 URL 图片，Pillow 合成最终海报
5. 存储至本地 /static/posters/，返回 URL（Phase 4 迁移至 OSS/MinIO）

### 3.4 关键架构改进（对标 V1 问题）

| V1 问题 | V2 解决方案 |
|---------|------------|
| API 路径不一致、无版本 | 统一 `/api/v2/` 前缀，OpenAPI 文档 |
| 环境配置硬编码 | `.env` + Spring profiles |
| 无缓存 | Redis 缓存活动列表、用户信息 |
| Controller 层逻辑过重 | 严格三层：Controller → Service Interface → Repository |
| 区块链强依赖 | 抽象 `BlockchainPort` 接口，默认 NoOp 实现 |
| 无操作审计 | 关键操作写 `audit_log` 表 |
| CORS 全开放 | 生产环境白名单配置 |
| 无全局状态管理 | Zustand（前端） |

---

## 四、数据库设计（V2）

### 新增 / 修改的核心表

```
-- 新增：通知表
notification (id, user_id, type, title, content, is_read, created_at)

-- 新增：海报表（✅ V7+V8 migration 已创建）
ai_poster (id, user_id, activity_id, task_id UNIQUE,
           user_prompt, status, poster_url, error_message, created_at, updated_at)

-- 新增：审计日志
audit_log (id, operator_id, action, target_type, target_id, detail JSONB, created_at)

-- 修改：template 支持自定义字段
template (id, name, type, form_schema JSONB, ...)

-- 修改：activity 新增人数上限
activity (..., max_participants INT, ...)

-- 修改：user_activity 新增 RE_SUBMITTED 状态 + reject_reason
user_activity (..., state ua_state, reject_reason VARCHAR(500), ...)

-- 修改：attachment 指向 OSS URL
attachment (id, user_activity_id, name, url, type, chain_id, created_at)
```

---

## 五、UI / UX 设计方向

### 5.1 设计原则

- **Desktop-First + Mobile-Ready**：桌面侧边栏布局 + 移动端自适应（表格→卡片、侧边栏→汉堡菜单）
- **数据可视化**：看板优先，Recharts 展示参与趋势
- **AI 功能突出**：海报生成有独立入口，流程引导清晰
- **一致性**：统一 shadcn/ui 组件，Admin 和 User 端共用 Design Token
- **响应式断点**：`md`（768px）为主要分界点，`< md` 显示移动端布局

### 5.2 用户端页面规划

```
/                   首页（活动动态 + 个人统计）
/activities         活动列表（卡片布局，筛选栏）
/activities/:id     活动详情 + 报名表单
/my                 个人中心（参与历史、贡献时间轴）
/poster             AI 海报生成工作台
/login              登录
```

### 5.3 管理端页面规划

```
/admin              看板（数据总览）
/admin/events       事件管理（Table + 侧边 Drawer 编辑）
/admin/activities   活动管理
/admin/details      活动明细（多维筛选 + 审核）
/admin/users        用户管理
/admin/notifications 通知模板管理
```

---

## 六、项目结构（csr_activity_v2）— Mono-repo 多模块

**一个仓库，三个模块**，独立运行但统一管理。

```
csr_activity_v2/                   ← 项目根目录（Git 仓库）
│
├── backend/                       # 模块1：Spring Boot 主后端
│   ├── src/
│   │   └── main/java/com/csr/
│   │       ├── auth/              # 认证模块
│   │       ├── event/             # 事件模块
│   │       ├── activity/          # 活动模块
│   │       ├── user/              # 用户模块
│   │       ├── notification/      # 通知模块
│   │       └── blockchain/        # 区块链预留模块
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/          # Flyway 数据库迁移脚本
│   └── pom.xml
│
├── ai-service/                    # 模块2：Python FastAPI AI 服务（✅ Phase 3 海报生成已完成）
│   ├── app/
│   │   ├── api/
│   │   │   └── poster.py          # ✅ POST /poster/generate + GET /poster/{task_id}
│   │   ├── agents/
│   │   │   ├── poster_agent.py    # ✅ 海报生成主流程
│   │   │   └── image_gen.py       # ✅ 通义万相 Wan 2.7 Image Pro
│   │   ├── utils/
│   │   │   ├── image_compose.py   # ✅ Pillow 合成海报
│   │   │   ├── prompt_builder.py  # ✅ prompt + negative_prompt 构建
│   │   │   └── storage.py         # ✅ 本地文件存储
│   │   ├── models.py              # ✅ Pydantic 模型
│   │   └── config.py              # ✅ 环境变量配置
│   ├── requirements.txt
│   ├── .env.example
│   └── main.py
│
├── csr-magic-mfe/                 # 模块3：Vite + React 19 前端（用户端 + 管理端）
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminApp.tsx       # 管理端（Dashboard/Events/Activities/Participations/Users）
│   │   │   └── EmployeeApp.tsx    # 用户端（Home/ActivityList/ActivityDetail/AIPosterStudio）
│   │   ├── services/              # API 客户端层
│   │   │   ├── apiClient.ts
│   │   │   ├── activityApi.ts
│   │   │   ├── eventApi.ts
│   │   │   ├── participationApi.ts
│   │   │   ├── userApi.ts
│   │   │   ├── notificationApi.ts
│   │   │   ├── dashboardApi.ts
│   │   │   └── posterApi.ts       # ✅ Phase 3 海报 API
│   │   └── App.tsx                # 角色路由（LoginPage / AdminApp / EmployeeApp）
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml             # 一键启动全部服务
├── .env.example                   # 环境变量示例
└── README.md
```

### 各模块端口约定

| 模块 | 技术 | 端口 | 状态 |
|------|------|------|------|
| backend | Spring Boot 3.4 / Maven | 8080 | ✅ Phase 2 完成 |
| ai-service | Python FastAPI | 8000 | ✅ Phase 3 海报生成完成 |
| frontend | Vite + React 19（`csr-magic-mfe`） | 3000 | ✅ Phase 2 完成 |
| PostgreSQL | - | 5432 | ✅ 运行中 |
| Redis | - | 6379 | 🔲 Phase 4 引入 |

---

## 七、实现优先级（建议分阶段）

### Phase 1 — 认证骨架 ✅
1. Spring Boot + PostgreSQL + Flyway 骨架
2. 注册 / 登录 / 退出 / JWT 黑名单
3. 前端登录页对接真实 API

### Phase 2 — 核心业务 ✅
4. 事件 / 活动 / 参与 / 通知 / 看板后端 API
5. 5 种活动模板（BASIC / DONATION / VOLUNTEER / CHECKIN / CUSTOM）
6. Admin Dashboard 全页面对接真实 API
7. Employee App 全页面对接真实 API
8. 全站移动端响应式适配（Admin 侧边栏折叠 + 表格→卡片；Employee 汉堡导航菜单）

### Phase 3 — AI 功能（海报生成 ✅ 2026-04-02 完成）
9. ✅ Python FastAPI AI 服务搭建
10. 🔲 Qwen 对话报名 Agent
11. ✅ AI 个性化海报生成（Wan 2.7 Image Pro / 通义万相）
12. ✅ 后端 PosterService + Flyway V7/V8 + 前端 AIPosterStudioPage

### Phase 4 — 增强功能
13. Redis 缓存迁移
14. 数据导出 / 区块链接口预留
15. OSS/MinIO 文件存储（替代本地 StaticFiles + base64 入库）

---

## 八、开放性问题（实现前需确认）

| 问题 | 影响 |
|------|------|
| ~~图像生成 API 选型？~~ **已确认：通义万相 Wan 2.7 Image Pro（DashScope）** | ✅ 已解决 |
| 前端是否需要中英文国际化？ | 同 V1 用 i18n |
| 文件存储用 MinIO 还是云 OSS？ | 运维复杂度 |
| 通知推送方式？（站内信 / 邮件 / 企业微信） | 通知模块实现方式 |
| 生产环境部署目标？（Docker / K8s / 云服务器） | DevOps 方案 |
