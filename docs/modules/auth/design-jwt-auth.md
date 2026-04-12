---
module: auth
feature: jwt-auth
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/coding-standards.md
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on: []
---

# JWT 认证 — 技术设计

## 概述
实现 JWT 无状态认证机制，包括 Token 签发、验证、自动刷新、登出失效和角色权限校验。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | `/api/v2/auth/refresh` | 刷新 Token | cookie 中的 refreshToken | `{ accessToken }` |
| POST | `/api/v2/auth/logout` | 登出 | 无 | `{ message }` |

## 前端实现
- **Axios 拦截器**：在 `apiClient.ts` 中配置
  - 请求拦截器：自动附加 `Authorization: Bearer <token>`
  - 响应拦截器：401 时尝试用 refresh token 刷新，失败则跳转登录页
- **认证相关 API（refresh / logout）必须使用独立 axios 实例**，不经过 apiClient 拦截器
  - 原因：拦截器从 localStorage 读 Token，但 401 响应拦截器的 clearAuth 可能已提前清除 Token
  - logout 必须显式传 Token 参数，先缓存再清除 localStorage
- **Token 存储**：Access Token → localStorage；Refresh Token → httpOnly cookie（由后端设置）
- **路由守卫**：`PrivateRoute` 检查 Token 有效性

## 后端实现
- **JwtUtil**：Token 生成（HS256）、解析、验证
  - Access Token 有效期：30 分钟
  - Refresh Token 有效期：7 天
  - payload 包含：userId、username、role、exp
- **JwtAuthFilter**：Spring Security Filter，拦截请求验证 Token
- **Token 黑名单**：登出时将 Token jti 存入 `token_blacklist` 表（Phase 4 迁移 Redis）
- **角色校验**：`@PreAuthorize("hasRole('ADMIN')")` 注解保护管理端 API
- **安全配置**：`SecurityFilterChain` 配置公开/认证/管理员路径
  - **注意**：`/logout` 必须放入 `permitAll` 列表，因为用户 Token 过期后仍需能调用登出，Controller 自行校验 Token 有效性

## 后端实现
- **Controller**：AuthController 增加 refresh、logout 端点
- **Service**：AuthService 增加 refreshToken、logout 方法
- **Filter**：JwtAuthFilter 继承 OncePerRequestFilter
- **Config**：SecurityConfig 配置过滤链

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 JwtUtil 工具类（生成/解析/验证 Token）
2. [x] 后端：创建 JwtAuthFilter（OncePerRequestFilter）
3. [x] 后端：创建 SecurityConfig（配置过滤链 + 路径权限）
4. [x] 后端：创建 token_blacklist 表 + Flyway 迁移脚本
5. [x] 后端：AuthService 增加 refresh/logout 方法
6. [x] 后端：AuthController 增加 refresh/logout 端点
7. [x] 前端：apiClient.ts 配置请求/响应拦截器
8. [x] 前端：实现 Token 自动刷新逻辑
9. [x] 前端：401 时自动跳转登录页
10. [x] 对照 spec-jwt-auth.md 验收标准自检

## 引用
- 对应功能规格：spec-jwt-auth.md
- 参考实现：docs/exemplar/
