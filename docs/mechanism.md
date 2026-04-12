# CSR Magic — AI 辅助开发机制说明

> 本文档描述 CSR Magic 项目中 AI 辅助开发的完整机制，包括渐进式上下文加载、上下文隔离、
> Skill 驱动的自动化编码流程，以及各组件之间的协作关系。

## 一、机制总览

```
┌─────────────────────────────────────────────────────────────────┐
│                     用户发起请求                                  │
│              "实现活动列表" / "修复登录报错"                        │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Skill 触发层                                   │
│  implement-feature Skill  /  fix-bug Skill                      │
│  根据用户意图自动匹配，进入对应流程                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               渐进式上下文加载（6 层）                             │
│  Layer 1 规则 → Layer 2 全景 → Layer 3 模块 →                    │
│  Layer 4 规格 → Layer 5 设计 → Layer 6 共享知识+原型              │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  自动编码 / 修复                                  │
│  按 Implementation Checklist 逐步执行                            │
│  遵循 Guard Rails + 编码规范 + UI 原型                            │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  验收自检 / 回归验证                               │
│  对照 spec-*.md 验收标准逐项检查                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 二、上下文隔离架构

### 设计原则

AI 不应一次性加载全部项目文档（60+ 个文件），而是按需、按层级隔离加载。
每个功能只加载与之相关的上下文切片，避免信息过载导致注意力稀释。

### 隔离层次

```
全局层（所有功能共享）
├── .windsurfrules（根）           ← 全局规则 + Guard Rails
├── agent.md                      ← 项目全景 + 模块索引 + 决策日志
└── docs/shared/*                 ← 跨模块共享知识（按需加载）

服务层（按服务隔离）
├── csr_magic_frontend/.windsurfrules   ← 前端专属规则
├── csr_magic_backend/.windsurfrules    ← 后端专属规则
└── csr_ai_service/.windsurfrules       ← AI 服务专属规则

模块层（按模块隔离）
├── docs/modules/{module}/_index.md         ← 模块概览 + 功能清单
├── docs/modules/{module}/spec-{feature}.md ← 功能规格（做什么）
└── docs/modules/{module}/design-{feature}.md ← 技术设计（怎么做）

原型层（前端 UI 专属）
└── UI_UX_prototype/src/components/*        ← UI/UX 交互原型
```

### 隔离效果

| 场景 | 加载的上下文 | 未加载的上下文 |
|------|------------|--------------|
| 实现登录页 | auth 模块 + 前端/后端规则 + api-contracts + data-models + LoginPage.tsx 原型 | 其他 9 个模块的 spec/design |
| 修复后端 API Bug | 对应模块 + 后端规则 + api-contracts | 前端规则、UI 原型 |
| 实现 Dashboard | dashboard 模块 + 前端/后端规则 + AdminApp.tsx 原型 | AI 服务规则 |

## 三、渐进式上下文加载（6 层模型）

每一层建立在前一层之上，按需逐层加载：

### Layer 1：规则层
- **文件**：根 `.windsurfrules` + 对应服务的 `.windsurfrules`
- **内容**：全局规则、Guard Rails（NEVER/ALWAYS）、编码规范、语言约定
- **作用**：建立编码行为边界，确保所有输出代码符合项目标准

### Layer 2：项目全景
- **文件**：`agent.md`
- **内容**：架构总览、技术栈、模块索引、前端路由、设计决策、Decision Log
- **作用**：理解项目整体结构和技术选型，为后续编码提供架构约束

### Layer 3：模块概览
- **文件**：`docs/modules/{module}/_index.md`
- **内容**：模块说明、功能清单（含实现状态）、依赖关系
- **作用**：确认功能边界和前置依赖，避免重复实现或遗漏依赖

### Layer 4：功能规格（做什么）
- **文件**：`docs/modules/{module}/spec-{feature}.md`
- **内容**：用户故事、页面内容、交互规则、API 概要、验收标准
- **作用**：明确需求边界，提取验收标准供阶段 4 自检使用

### Layer 5：技术设计（怎么做）
- **文件**：`docs/modules/{module}/design-{feature}.md`
- **内容**：Context Manifest（声明依赖）、技术方案、Implementation Checklist、UI 原型参考
- **作用**：获取具体编码步骤和技术方案，解析 Context Manifest 确定后续加载清单

### Layer 6：共享知识 + 参考实现 + UI 原型
- **文件**：由 Layer 5 Context Manifest 声明的 shared docs + exemplar + UI 原型
- **内容**：API 契约、数据模型、编码标准、参考实现代码、UI 原型组件代码
- **作用**：提供编码所需的具体技术细节和视觉参考

### Context Manifest 机制

每个 `design-*.md` 顶部使用 YAML frontmatter 声明依赖：

```yaml
---
module: activity
feature: activity-crud
requires_context:             # 需要加载的 shared docs
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:                 # UI 原型参考（前端功能专用）
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 322-547
    desc: 活动管理页（筛选栏+表格、右侧 Drawer 创建表单含封面上传）
services:                     # 涉及的服务（决定加载哪些 .windsurfrules）
  - csr_magic_frontend
  - csr_magic_backend
depends_on:                   # 前置 design 依赖
  - docs/modules/event/design-event-crud.md
---
```

AI 读取此 Manifest 后，自动知道该功能需要加载哪些文档、哪些服务规则、哪些 UI 原型。

## 四、Skill 驱动机制

### Skill 概述

Skill 是封装了完整工作流程的 AI 指令集，位于 `.windsurf/skills/{skill-name}/SKILL.md`。
与普通对话不同，Skill 提供结构化的多阶段流程，确保 AI 按标准化步骤完成任务。

### 当前 Skills

| Skill | 路径 | 触发条件 | 流程 |
|-------|------|---------|------|
| implement-feature | `.windsurf/skills/implement-feature/` | "实现功能"、"开发 XX"、"做 XX 页面" | 交互选择 → 6 层上下文 → 自动编码 → 验收自检 |
| fix-bug | `.windsurf/skills/fix-bug/` | "修复 Bug"、"XX 报错"、"XX 不正常" | 收集信息 → 上下文加载 → 根因分析 → 最小化修复 → 回归验证 |

### implement-feature Skill 流程

```
阶段 1：交互式选择
├── 1.1 读取 agent.md 获取模块列表
├── 1.2 用户选择模块（10 选 1）
└── 1.3 用户选择功能（读取 _index.md）
         ↓
阶段 2：渐进式上下文加载
├── Layer 1：规则层（.windsurfrules）
├── Layer 2：项目全景（agent.md）
├── Layer 3：模块概览（_index.md）
├── Layer 4：功能规格（spec-*.md）→ 提取验收标准
├── Layer 5：技术设计（design-*.md）→ 解析 Context Manifest + Checklist
└── Layer 6：shared docs + exemplar + UI 原型
         ↓
阶段 3：自动编码
├── 按 Implementation Checklist 逐步执行
├── 遵循 Guard Rails + 编码规范
├── 前端遵循 UI 原型设计
├── 涉及新 API → 参考 sub-procedures.md
├── 涉及新表 → 参考 sub-procedures.md
├── 同步更新文档（api-contracts / data-models / Decision Log）
└── 每步完成后标记 Checklist [x]
         ↓
阶段 4：验收自检
├── 4.1 逐项对照 spec-*.md 验收标准
├── 4.2 Guard Rails 最终检查
└── 4.3 输出完成报告
```

### fix-bug Skill 流程

```
阶段 1：定位问题
├── 1.1 收集 Bug 信息（复现步骤、预期/实际行为）
├── 1.2 按需加载上下文（含 UI 原型对照）
└── 1.3 根因分析（定位根因，非表面症状）
         ↓
阶段 2：修复
├── 2.1 最小化编码修复
└── 2.2 同步更新文档
         ↓
阶段 3：验证
├── 3.1 回归检查
└── 3.2 输出修复报告
```

### Skill 辅助文件

```
.windsurf/skills/implement-feature/
├── SKILL.md                              # 主流程定义
└── references/
    ├── modules-quick-ref.md              # 模块/功能速查表
    └── sub-procedures.md                 # 子流程（新增 API / 新增数据表）

.windsurf/skills/fix-bug/
└── SKILL.md                              # 主流程定义
```

## 五、Guard Rails 机制

Guard Rails 是硬性编码约束，分为禁止事项（NEVER）和必须事项（ALWAYS），
定义在根 `.windsurfrules` 中，在多个层面被检查：

### 检查时机

| 时机 | 检查者 | 检查内容 |
|------|--------|---------|
| 编码中（每步 Checklist） | implement-feature Skill 3.1 | 无 `any`、无硬编码、有错误处理 |
| 编码后（验收自检） | implement-feature Skill 4.2 | 完整 Guard Rails 清单 |
| Bug 修复中 | fix-bug Skill 2.1 | 无 `any`、无硬编码、有错误处理 |

### 核心规则摘要

**NEVER**：`any` 类型、硬编码密钥/URL、组件内直接 fetch、跳过错误处理、mock 数据、跳步

**ALWAYS**：更新 api-contracts、更新 data-models、遵循分层模式、记录 Decision Log、按序执行 Checklist、对照验收标准自检

## 六、UI 原型驱动机制

### 原型定位

`UI_UX_prototype/` 是前端交互设计的权威参考，包含完整的员工端和管理端 UI 原型。

### 集成方式

1. **设计令牌文档**：`docs/shared/ui-design-tokens.md` 从原型提取颜色、圆角、阴影、排版、布局模式和公共组件模式
2. **Context Manifest 声明**：每个 design-*.md 的 YAML frontmatter 中通过 `ui_prototype` 字段声明对应原型文件和行范围
3. **UI 原型参考节**：每个 design-*.md 底部包含原型映射表（文件 + 行范围 + 关键 UI 元素描述）
4. **Skill 自动加载**：implement-feature Skill 在 Layer 6 自动读取原型代码；fix-bug Skill 在 UI Bug 时对照原型

### 原型覆盖范围

11/17 个功能有对应 UI 原型，3 个功能（event-crud、notification-system、profile-settings）暂无原型覆盖。
完整映射表见 `docs/shared/ui-design-tokens.md` 第四节。

## 七、文档体系全景

```
docs/
├── mechanism.md                    # 本文档（机制说明）
├── shared/                         # 跨模块共享知识
│   ├── api-contracts.md            # API 契约（端点/请求/响应）
│   ├── api-guidelines.md           # API 设计规范
│   ├── coding-standards.md         # 编码规范
│   ├── data-models.md              # 数据模型（表结构）
│   ├── tech-stack.md               # 技术栈详情
│   ├── ui-design-tokens.md         # 设计令牌 + 原型映射
│   └── ...
├── exemplar/                       # 参考实现样本
│   ├── exemplar-overview.md        # 使用说明
│   ├── exemplar-frontend.md        # 前端参考代码
│   └── exemplar-backend.md         # 后端参考代码
├── modules/                        # 按模块组织
│   └── {module}/
│       ├── _index.md               # 模块概览 + 功能清单
│       ├── spec-{feature}.md       # 功能规格（做什么）
│       └── design-{feature}.md     # 技术设计（怎么做）
└── reference/                      # 原始参考文档（只读）

.windsurfrules                      # 全局规则 + Guard Rails
agent.md                            # 项目导航地图 + Decision Log
UI_UX_prototype/                    # UI/UX 交互原型

.windsurf/skills/                   # AI Skills
├── implement-feature/              # 功能实现 Skill
│   ├── SKILL.md
│   └── references/
└── fix-bug/                        # Bug 修复 Skill
    └── SKILL.md
```

## 八、机制优势

| 维度 | 传统方式 | 本机制 |
|------|---------|-------|
| 上下文管理 | 全量加载或手动指定 | 渐进式 6 层自动加载，按 Context Manifest 精确控制 |
| 编码流程 | 自由发挥 | Skill 驱动 + Checklist 逐步执行，可追踪进度 |
| 质量保障 | 事后 Code Review | Guard Rails 实时检查 + 验收标准自动自检 |
| UI 一致性 | 靠开发者记忆 | 原型代码直接映射到 design 文件，编码时自动加载 |
| 文档同步 | 容易遗忘 | Skill 内置文档更新提醒（api-contracts / data-models） |
| 知识隔离 | 信息过载 | 模块级隔离，只加载当前任务所需的最小上下文集 |
