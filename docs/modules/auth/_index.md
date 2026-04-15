# 认证模块（auth）

## 概述
负责用户身份验证和授权，包括登录、注册、JWT Token 管理。是所有其他模块的基础依赖。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 登录/注册 | spec-login-register.md | design-login-register.md | ✅ 已实现 | 无 |
| JWT 认证 | spec-jwt-auth.md | design-jwt-auth.md | ✅ 已实现 | 无 |

## 模块间依赖
- **被依赖**：所有其他模块都依赖 auth 的 JWT 认证
- **无外部依赖**：auth 是最底层模块

## 推荐实现顺序
1. login-register（登录/注册 — 无依赖） ✅ 已完成
2. jwt-auth（JWT 认证 — 与登录/注册并行或紧随其后） ✅ 已完成

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/LoginPage.tsx`、`RegisterPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/auth/`
- **AI 服务**：不涉及
