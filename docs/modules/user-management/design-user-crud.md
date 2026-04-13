---
module: user-management
feature: user-crud
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 768-1046
    desc: 用户管理页（表格+右侧 SidePanel 用户详情/统计/权限开关）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/auth/design-jwt-auth.md
---

# 用户 CRUD — 技术设计

## 概述
管理端用户管理功能实现，包括用户列表（搜索+筛选+分页）、详情查看/编辑、角色配置和密码重置。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/users` | 用户列表 | query: page, size, keyword, region | `PageResponse<UserResponse>` |
| GET | `/api/v2/users/{id}` | 用户详情 | - | `UserDetailResponse` |
| PUT | `/api/v2/users/{id}` | 更新用户 | `UpdateUserRequest` | `UserResponse` |
| DELETE | `/api/v2/users/{id}` | 删除用户 | - | - |
| PUT | `/api/v2/users/{id}/reset-password` | 重置密码 | `{ newPassword }` | - |

## 数据模型
- 使用 `users` 表（见 data-models.md）
- UserDetailResponse 扩展 UserResponse，增加参与记录统计

## 前端实现
- **页面**：`pages/admin/UserManagementPage.tsx`
- **组件**：
  - `UserTable.tsx`（用户表格）
  - `UserDetailDrawer.tsx`（详情/编辑抽屉）
  - `ResetPasswordDialog.tsx`（重置密码弹窗）
- **API Service**：`services/userApi.ts`
- **路由**：`/admin/users`
- **响应式**：桌面端表格 / 移动端卡片列表（头像+角色 badge）

## 后端实现
- **包路径**：`com.csr.user`
- **Controller**：UserController — 5 个端点
- **Service**：UserService — CRUD + resetPassword
- **Repository**：复用 UserRepository
- **DTO**：UserResponse、UserDetailResponse、UpdateUserRequest
- **权限**：所有端点需 ADMIN 角色

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 DTO（UserResponse、UserDetailResponse、UpdateUserRequest、ResetPasswordRequest）
2. [x] 后端：创建 UserService（list/getById/update/delete/resetPassword）
3. [x] 后端：创建 UserController（5 个端点）
4. [x] 前端：创建 services/userApi.ts
5. [x] 前端：创建 UserManagementPage.tsx
6. [x] 前端：创建 UserTable.tsx
7. [x] 前端：创建 UserDetailPanel.tsx（SidePanel 风格，遵循 UI 原型）
8. [x] 前端：创建 ResetPasswordDialog.tsx
9. [x] 前端：接入路由 /admin/users
10. [x] 前端：响应式适配（表格→卡片）
11. [x] 对照 spec-user-crud.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/AdminApp.tsx` | 768-1046 | Checkbox 表格（头像+姓名+邮箱/角色徽章/状态指示灯/志愿时长）、右侧 SidePanel（用户详情+CSR统计+Admin权限开关+账户状态+最近活动时间线）、筛选栏、分页、批量 Message |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-user-crud.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
