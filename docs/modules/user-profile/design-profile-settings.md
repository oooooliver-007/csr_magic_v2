---
module: user-profile
feature: profile-settings
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/auth/design-jwt-auth.md
---

# 个人设置 — 技术设计

## 概述
实现员工端个人信息查看和修改功能，包括昵称/真名编辑和密码修改。员工端和管理端均可访问。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/users/me` | 当前用户信息 | - | `UserResponse` |
| PUT | `/api/v2/users/me` | 更新个人信息 | `{ displayName, realName, region, gender }` | `UserResponse` |
| PUT | `/api/v2/users/me/password` | 修改密码 | `{ currentPassword, newPassword }` | - |

## 前端实现
- **页面**：`pages/MyProfilePage.tsx`（作为 Tab 的一部分，或独立设置区域）
- **组件**：
  - `ProfileInfoForm.tsx`（个人信息编辑表单）
  - `PasswordChangeForm.tsx`（密码修改表单）
- **API Service**：`services/userApi.ts`（me 相关方法）
- **表单验证**：React Hook Form + Zod
  - 密码修改：currentPassword 必填，newPassword ≥6位，confirmPassword 与 newPassword 一致
- **路由**：`/my`（员工端）、管理端也可访问

## 后端实现
- **Controller**：UserController 增加 /me 端点（或独立 ProfileController）
- **Service**：UserService
  - getMe：根据 JWT 中的 userId 获取用户信息
  - updateMe：更新个人信息（不可修改 role）
  - changePassword：验证 currentPassword → 更新为 newPassword（BCrypt）
- **安全**：changePassword 必须验证当前密码，防止未授权修改

## 实现步骤清单（Implementation Checklist）
1. [ ] 后端：UserService 增加 getMe/updateMe/changePassword 方法
2. [ ] 后端：UserController 增加 GET/PUT /users/me、PUT /users/me/password 端点
3. [ ] 前端：userApi.ts 增加 getMe/updateMe/changePassword 方法
4. [ ] 前端：创建 ProfileInfoForm.tsx
5. [ ] 前端：创建 PasswordChangeForm.tsx
6. [ ] 前端：集成到 MyProfilePage.tsx
7. [ ] 前端：表单验证（Zod schema）
8. [ ] 对照 spec-profile-settings.md 验收标准自检

## 引用
- 对应功能规格：spec-profile-settings.md
- 参考实现：docs/exemplar/
