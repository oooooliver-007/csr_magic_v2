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

### 3. 前端对接
1. 在 `types/` 中创建/更新 TypeScript 类型
2. 在 `services/` 中添加 API 调用方法
3. 在页面/组件中集成调用

### 4. 更新文档
- 更新 `docs/shared/api-contracts.md`，添加新端点到对应模块表格
- 如涉及新表/字段，更新 `docs/shared/data-models.md`

### 5. 单元测试
- 后端：为 Service 和 Controller 编写 JUnit 5 测试（正常 + 异常流程）
- 前端：为 API 调用封装和相关组件编写 Vitest 测试
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
