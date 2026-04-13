# 子流程参考

> 在 Implementation Checklist 执行过程中，涉及新增 API 或新增数据表时，参考以下标准步骤。

## 新增 API 端点

### 1. 设计 API
- 参考 `docs/shared/api-guidelines.md` 确定 URL、HTTP 方法、请求/响应格式
- 确认分页、筛选、错误码等是否符合规范

### 2. 后端实现
1. 创建/更新 DTO（请求 + 响应）
2. 创建/更新 Service 方法
3. 创建/更新 Controller 端点
4. 如涉及新表，创建 Flyway 迁移脚本 + Entity + Repository
5. 配置权限（公开 / 认证 / Admin）
   - **逐一审查** SecurityConfig 中 `permitAll` 列表是否包含所有不需认证的端点
   - **特别注意**：涉及 Token 操作的端点（如 logout、refresh）通常需要 `permitAll`，由 Controller 自行校验 Token

### 3. 前端对接
1. 在 `types/` 中创建/更新 TypeScript 类型
2. 在 `services/` 中添加 API 调用方法
3. 在页面/组件中集成调用

### 4. 更新文档
- 更新 `docs/shared/api-contracts.md`，添加新端点到对应模块表格
- 如涉及新表/字段，更新 `docs/shared/data-models.md`

### 5. 单元测试
- 后端：为 Service 和 Controller 编写 JUnit 5 测试（正常 + 异常流程）
  - Controller 测试**必须包含权限集成测试**：验证无 Token 访问 permitAll 端点返回 200、无 Token 访问受保护端点返回 401
  - 不能只用 `addFilters=false` 绕过 Security Filter
- 前端：为 API 调用封装和相关组件编写 Vitest 测试
  - 认证相关 API 测试需验证 Token 显式传递（非拦截器隐式附加）
- 运行测试确保全部通过

### 6. 验证
- 使用 Swagger UI 或 curl 验证端点响应
- 检查错误码、分页、权限是否符合规范

---

## 新增数据库表

### 1. 设计表结构
- 参考 `docs/shared/data-models.md` 了解现有表结构和命名约定
- 字段名使用 snake_case
- 时间字段使用 `TIMESTAMP WITH TIME ZONE`
- 主键使用 `BIGSERIAL PRIMARY KEY`

### 2. 创建 Flyway 迁移脚本
- 路径：`csr_magic_backend/src/main/resources/db/migration/`
- 命名格式：`V{version}__{description}.sql`（两个下划线）
- 版本号递增，不重复
- SQL 中使用 `IF NOT EXISTS` 防止重复执行

### 3. 创建 JPA Entity
- 包路径：`com.csr.{module}.entity`
- 注解：`@Entity` + `@Table(name = "xxx")`
- 时间字段使用 `java.time.Instant`
- 配置 `@PrePersist` / `@PreUpdate` 自动时间戳

### 4. 创建 Repository
- 包路径：`com.csr.{module}.repository`
- 继承 `JpaRepository<Entity, Long>`

### 5. 更新文档
- 更新 `docs/shared/data-models.md`，添加新表结构
- 在对应模块的 `design-*.md` 中标记 Checklist 已完成

### 6. 单元测试
- 为 Repository 和相关 Service 方法编写单元测试
- 运行 `mvn test` 确保全部通过

### 7. 验证
- 启动后端服务，确认 Flyway 迁移成功执行
- 确认表结构与设计一致

---

## Playwright E2E 测试

> 在阶段 4.2 执行 E2E 测试时，参考以下标准步骤。

### 1. 环境预检

```
1. 读取 vite.config.ts → 获取 server.port（记为 FRONTEND_PORT）
2. 读取 SecurityConfig.java → 获取 CORS allowedOrigins
3. 验证 http://localhost:{FRONTEND_PORT} 在 CORS 白名单中
4. 如不一致 → 停止，报告端口/CORS 不匹配
```

### 2. 服务启动

```
1. netstat 检查 :8080 和 :{FRONTEND_PORT}
2. 后端未运行 → mvn spring-boot:run (非阻塞, WaitMs=15000)
   → 等待 "Tomcat started on port 8080"
3. 前端未运行 → npx vite (非阻塞, WaitMs=8000)
   → 不手动指定 --port，让 vite.config.ts 决定
4. netstat 二次确认两个端口都 LISTENING
```

### 3. 认证准备

```
1. navigate 到 /login
2. 用 mcp1_query 检查可用账号：
   SELECT username, role FROM csr_v2.users LIMIT 10;
3. 无可用账号 → 通过 UI 注册账号（填表 + 点注册按钮）
4. 如果需要 ADMIN 角色：
   a. mcp1_query: UPDATE csr_v2.users SET role = 'ADMIN' WHERE username = '...' RETURNING id, username, role;
   b. 重新通过 UI 登录（JWT 需要刷新 role）
5. 登录成功后，用 SPA 内导航（点击侧边栏链接），不要用 page.goto()

注意：所有数据库操作统一使用 mcp1_query（MCP DB-postgres），表名加 csr_v2. schema 前缀。
```

### 4. 常见问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| CORS 错误 | 前端端口不在 allowedOrigins | 用 CORS 白名单内的端口启动前端 |
| 登录后 navigate 被重定向到 /login | page.goto() 刷新页面，Zustand 状态丢失 | 用 SPA 内导航或重新 UI 登录 |
| 元素 outside viewport 无法点击 | Playwright 的 actionability 检查 | 用 `page.evaluate(() => btn.click())` |
| PowerShell mvn -D 参数报错 | PowerShell 将 -D 解析为参数 | 引号包裹：`"-Dtest=..."` |
| 注册/登录按钮点击无反应 | 表单验证未通过或网络请求失败 | 检查 console messages 和 network requests |
| API 返回 403 | 用户角色不足 | psql 升级角色 + 重新登录 |
| API 返回 500 | 后端异常 | 检查 Spring Boot 控制台日志 |
