# JWT 认证 — 功能规格

## 概述
基于 JWT 的无状态认证机制，管理 Access Token 和 Refresh Token 的签发、验证、刷新和失效。

## 所属信息
- 模块：auth
- 前置依赖：无

## 用户故事
- 作为已登录用户，我希望在 Token 过期前系统自动刷新，以便不被频繁要求重新登录
- 作为用户，我希望登出后 Token 立即失效，以便保障账号安全

## 功能要求

### Token 签发
- 登录成功后签发 Access Token（短期，如 30 分钟）和 Refresh Token（长期，如 7 天）
- Access Token 放在响应 body 中，前端存 localStorage
- Refresh Token 放在 httpOnly cookie 中

### Token 验证
- 所有受保护 API 检查 `Authorization: Bearer <accessToken>`
- Token 无效或过期返回 401
- 角色不匹配返回 403

### Token 刷新
- Access Token 过期后，前端自动使用 Refresh Token 请求新 Token
- Refresh Token 有效 → 签发新 Access Token
- Refresh Token 过期 → 返回 401，前端跳转登录页

### Token 失效（登出）
- 登出时将当前 Token 加入黑名单
- 黑名单存储：当前使用 PostgreSQL，Phase 4 迁移至 Redis

### 角色校验
- USER 角色：可访问员工端 API
- ADMIN 角色：可访问管理端 API + 员工端 API

## 验收标准
- [ ] 登录成功返回 Access Token 和 Refresh Token
- [ ] 受保护 API 无 Token 时返回 401
- [ ] Token 过期时返回 401
- [ ] Refresh Token 有效时可获取新 Access Token
- [ ] 登出后旧 Token 不可再使用
- [ ] ADMIN 角色可访问管理端 API
- [ ] USER 角色访问管理端 API 返回 403
- [ ] 前端 Axios 拦截器自动处理 Token 刷新
