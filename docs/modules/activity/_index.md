# 活动模块（activity）

## 概述
CSR 活动的核心模块，涵盖员工端活动浏览和管理端活动管理。活动隶属于事件，支持 5 种模板类型。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 活动列表（员工端） | spec-activity-list.md | design-activity-list.md | 已实现 | event |
| 活动详情 + 报名 | spec-activity-detail.md | design-activity-detail.md | 待实现 | activity-list |
| 活动 CRUD（管理端） | spec-activity-crud.md | design-activity-crud.md | 已实现 | event |
| 5种活动模板 | spec-activity-templates.md | design-activity-templates.md | 待实现 | activity-crud |

## 模块间依赖
- **依赖**：auth（认证）、event（活动必须关联事件）
- **被依赖**：participation（报名依赖活动详情）、dashboard（统计依赖活动数据）、ai-poster、ai-chat-registration

## 推荐实现顺序
1. activity-crud（管理端 CRUD — 依赖 event，先有数据）
2. activity-templates（5种模板 — 依赖 activity-crud）
3. activity-list（员工端列表 — 依赖 event 数据）
4. activity-detail（员工端详情+报名 — 依赖 activity-list）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/`（员工端 ActivityListPage、ActivityDetailPage；管理端 ActivityManagementPage）
- **后端**：`csr_magic_backend/src/main/java/com/csr/activity/`
- **AI 服务**：不涉及（AI 功能在独立模块中）
