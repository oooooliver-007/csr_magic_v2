# 用户管理模块（user-management）

## 概述
管理端用户 CRUD 功能，包括用户列表、搜索、详情查看、角色配置和密码重置。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 用户 CRUD | spec-user-crud.md | design-user-crud.md | 待实现 | auth |

## 模块间依赖
- **依赖**：auth（Admin 角色校验）
- **被依赖**：无

## 推荐实现顺序
1. user-crud（仅一个功能，直接实现）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/admin/UserManagementPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/user/`
- **AI 服务**：不涉及
