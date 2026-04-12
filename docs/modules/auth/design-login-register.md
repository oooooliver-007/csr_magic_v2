---
module: auth
feature: login-register
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/LoginPage.tsx
    lines: 1-38
    desc: 登录页（居中卡片、Logo、员工/管理员双按钮）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on: []
---

# 登录/注册 — 技术设计

## 概述
实现用户登录和注册的前后端全链路，包括表单验证、API 调用、JWT Token 存储和路由守卫。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | `/api/v2/auth/login` | 用户登录 | `{ username, password }` | `{ accessToken, refreshToken, user }` |
| POST | `/api/v2/auth/register` | 用户注册 | `{ username, password, displayName, region, gender }` | `{ accessToken, refreshToken, user }` |

## 数据模型
- 使用 `users` 表（见 data-models.md）
- 密码使用 BCrypt 加密存储
- role 默认为 'USER'

## 前端实现
- **页面文件**：`pages/LoginPage.tsx`、`pages/RegisterPage.tsx`
- **路由**：`/login`、`/register`（公开路由）
- **API Service**：`services/authApi.ts`
- **状态管理**：登录成功后将 Token 存入 localStorage，用户信息存入 Zustand store
- **路由守卫**：`PrivateRoute` 组件检查 Token，未登录重定向 `/login`
- **表单验证**：React Hook Form + Zod schema

## 后端实现
- **Controller**：`AuthController` — `/api/v2/auth/login`、`/api/v2/auth/register`
- **Service**：`AuthService` — 验证凭证、创建用户、签发 Token
- **Repository**：复用 `UserRepository`
- **密码加密**：`BCryptPasswordEncoder`
- **安全配置**：`/api/v2/auth/**` 路径放行（不需要认证）

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 User Entity（如不存在）+ UserRepository
2. [x] 后端：创建 AuthService（register + login 逻辑）
3. [x] 后端：创建 AuthController（POST /auth/login、POST /auth/register）
4. [x] 后端：配置 Spring Security 放行 auth 路径
5. [x] 后端：BCrypt 密码加密配置
6. [x] 前端：创建 authApi.ts（login、register 方法）
7. [x] 前端：创建 LoginPage.tsx（表单 + 验证 + 调用 API）
8. [x] 前端：创建 RegisterPage.tsx（表单 + 验证 + 调用 API）
9. [x] 前端：创建 auth Zustand store（存储用户信息 + Token）
10. [x] 前端：创建 PrivateRoute 路由守卫组件
11. [x] 前端：响应式适配检查
12. [x] 对照 spec-login-register.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/LoginPage.tsx` | 1-38 | 居中白色卡片、绿色叶子 Logo、双按钮（员工绿色实心 / 管理员白色边框） |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-login-register.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
