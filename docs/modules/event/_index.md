# 事件管理模块（event）

## 概述
管理 CSR 大事件（Event = 多个活动的容器），提供完整的 CRUD 功能。仅管理端使用。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 事件 CRUD | spec-event-crud.md | design-event-crud.md | 待实现 | auth |

## 模块间依赖
- **依赖**：auth（JWT 认证 + Admin 角色校验）
- **被依赖**：activity 模块（活动必须关联事件）

## 推荐实现顺序
1. event-crud（仅一个功能，直接实现）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/admin/EventManagementPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/event/`
- **AI 服务**：不涉及

## 参考实现
本模块（Event CRUD）被选为 Exemplar 参考实现样本，详见 `docs/exemplar/`。
