# 编码规范

> 跨服务编码规范，`.windsurfrules` 中的 Guard Rails 是精简版，本文档是完整版。

## 通用规范

### 命名约定

| 层 | 风格 | 示例 |
|----|------|------|
| 前端变量/函数 | camelCase | `activityList`, `handleSubmit` |
| 前端组件 | PascalCase | `ActivityCard`, `LoginPage` |
| 前端文件（组件） | PascalCase.tsx | `ActivityCard.tsx` |
| 前端文件（工具） | camelCase.ts | `apiClient.ts` |
| 后端类名 | PascalCase | `ActivityService`, `EventController` |
| 后端方法/变量 | camelCase | `findById`, `activityName` |
| 后端包名 | 全小写 | `com.csr.activity.service` |
| 数据库表名 | snake_case | `user_activity` |
| 数据库字段 | snake_case | `created_at`, `template_type` |
| API 路径 | kebab-case | `/api/v2/chat-sessions` |
| 环境变量 | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

### 错误处理

- 所有 API 调用必须有错误处理（try/catch 或 .catch()）
- 后端 Service 层抛出业务异常，Controller 统一捕获转换为 HTTP 响应
- 前端统一在 Axios 拦截器处理 401/403/500 等通用错误
- 业务错误在具体调用处处理并展示用户友好提示

### 日志规范

- 后端使用 SLF4J，禁止 System.out.println
- AI 服务使用 Python logging 模块，禁止 print
- 日志级别：ERROR（异常）> WARN（潜在问题）> INFO（关键操作）> DEBUG（调试）
- 敏感信息（密码、Token）禁止出现在日志中

## 前端规范（TypeScript / React）

### 组件规范
- 使用函数式组件 + Hooks，禁止 class 组件
- Props 使用 interface 定义，文件顶部声明
- 大组件拆分为小组件，单个组件不超过 200 行
- 自定义 Hook 以 `use` 开头，放在 `hooks/` 目录

### 状态管理
- 组件局部状态：useState / useReducer
- 全局客户端状态：Zustand store（`stores/` 目录）
- 服务端状态：React Query（通过 `services/` 层调用）

### 样式规范
- 使用 TailwindCSS utility classes，禁止内联 style
- 响应式：`md:` 前缀为主断点（768px）
- 颜色使用 Tailwind 预设，不硬编码 hex 值

### API 调用
- 所有 API 调用通过 `services/` 层封装
- 使用 Axios 实例（`apiClient.ts`），统一配置 baseURL 和拦截器
- 禁止在组件中直接使用 fetch 或 axios
- **认证相关 API（refresh / logout 等）必须使用独立 axios 实例**，不经过 apiClient 拦截器
  - 原因：apiClient 请求拦截器依赖 localStorage 读 Token，但 Token 可能已被其他流程（如 401 响应拦截器）清除
  - 正确做法：调用方显式传入 Token 参数，API 方法内部设置 Authorization header

## 后端规范（Java / Spring Boot）

### 分层架构
```
Controller → Service Interface → Service Impl → Repository
                                      ↕
                               DTO ↔ Entity 转换
```

### 包结构
```
com.csr.{module}/
├── controller/     # REST Controller
├── service/        # Service 接口 + 实现
├── repository/     # Spring Data Repository
├── dto/            # 请求/响应 DTO
├── entity/         # JPA Entity
└── exception/      # 模块级异常
```

### DTO 规范
- 请求 DTO：`{Action}{Entity}Request`（如 `CreateActivityRequest`）
- 响应 DTO：`{Entity}Response`（如 `ActivityResponse`）
- Entity ↔ DTO 转换使用静态工厂方法或 MapStruct

### 数据库规范
- 使用 Flyway 管理迁移，脚本命名：`V{version}__{description}.sql`
- 禁止在代码中手动建表或修改表结构
- 查询使用 JPA Repository 方法或 @Query 注解，禁止拼接 SQL

## AI 服务规范（Python / FastAPI）

### 项目结构
```
app/
├── api/            # 路由处理
├── agents/         # AI Agent 逻辑
├── utils/          # 工具函数
├── models.py       # Pydantic 请求/响应模型
└── config.py       # 配置（环境变量）
```

### 异步规范
- 所有 IO 操作使用 async/await
- HTTP 调用使用 httpx.AsyncClient
- 禁止在异步函数中使用同步阻塞调用

### Prompt 管理
- Prompt 模板化，支持变量替换
- 模板文件放在 `app/prompts/` 或常量中
- 禁止在代码逻辑中硬编码 prompt 文本

## 测试规范

### 通用原则
- 每个功能实现完成后必须编写单元测试
- 测试覆盖正常流程和异常流程
- 测试命名清晰描述被测场景，使用中文注释说明测试意图
- 禁止测试之间相互依赖，每个测试独立运行

### 后端测试（JUnit 5 + Mockito）
- 路径：`src/test/java/com/csr/{module}/`
- **Service 测试**：使用 `@ExtendWith(MockitoExtension.class)` + `@Mock` 注入依赖
- **Controller 测试**：使用 `@WebMvcTest` + `MockMvc` 验证 HTTP 状态码、响应体、参数校验
  - **必须同时包含权限配置测试**：不能只用 `addFilters=false` 绕过 Security Filter，还需测试 `permitAll` / `authenticated` / `hasRole` 路径是否配置正确
  - 特别注意：登出、刷新等端点必须验证无 Token 时也能正常访问
- 命名：`{ClassName}Test.java`
- 运行：`mvn test`

### 前端测试（Vitest + React Testing Library）
- 路径：`src/__tests__/` 或组件同目录 `*.test.tsx`
- **组件测试**：使用 `render` + `screen` + `userEvent` 验证渲染和交互
- **Store 测试**：直接调用 action 验证状态变更
- **Service 测试**：mock axios 验证请求参数和响应处理
- 命名：`{Name}.test.tsx` 或 `{name}.test.ts`
- 运行：`npx vitest run`

### 端到端测试（Playwright MCP）
- 功能验收时使用 Playwright MCP 工具执行 E2E 测试
- 测试场景对标 spec-*.md 验收标准
- 至少覆盖：页面渲染、正常业务流程、异常流程（验证/错误提示）
