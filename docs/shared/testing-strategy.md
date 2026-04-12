# 测试策略

> 三服务统一测试框架、覆盖率目标和测试模式。

## 前端测试（csr_magic_frontend）

| 类型 | 框架 | 覆盖范围 | 目标 |
|------|------|---------|------|
| 单元测试 | Vitest | 工具函数、自定义 Hook、Store | ≥80% |
| 组件测试 | Vitest + Testing Library | 核心组件渲染、交互 | 关键路径 |
| E2E 测试 | Playwright | 核心用户流程 | 冒烟测试级别 |

### 前端测试规范
- 测试文件与源文件同目录，命名 `*.test.ts` / `*.test.tsx`
- Mock API 使用 MSW（Mock Service Worker）
- 测试 ID：组件添加 `data-testid` 属性，用于 E2E 定位
- 异步操作使用 `waitFor` / `findBy` 等待

## 后端测试（csr_magic_backend）

| 类型 | 框架 | 覆盖范围 | 目标 |
|------|------|---------|------|
| 单元测试 | JUnit 5 + Mockito | Service 层业务逻辑 | ≥80% |
| 集成测试 | Spring Boot Test + Testcontainers | Controller + Repository | 关键 API |
| 数据库测试 | @DataJpaTest + H2 / Testcontainers | Repository 查询 | 复杂查询 |

### 后端测试规范
- 测试类命名：`{ClassName}Test`（单元）/ `{ClassName}IT`（集成）
- Service 测试 Mock Repository，不依赖数据库
- Controller 测试使用 MockMvc，验证 HTTP 状态码和响应体
- 使用 @Transactional 确保集成测试数据隔离

## AI 服务测试（csr_ai_service）

| 类型 | 框架 | 覆盖范围 | 目标 |
|------|------|---------|------|
| 单元测试 | pytest | 工具函数、prompt 构建、模型验证 | ≥70% |
| 集成测试 | pytest + httpx | API 端点 | 关键 API |
| Mock 外部 | pytest-mock / respx | DashScope API 调用 | 100% Mock |

### AI 服务测试规范
- 测试文件放在 `tests/` 目录，命名 `test_*.py`
- DashScope API 调用必须 Mock，禁止在测试中真实调用
- Prompt 模板变更需更新对应测试用例
- 使用 pytest fixtures 管理测试数据

## 通用测试原则

1. **不测试框架行为**：只测试自己写的业务逻辑
2. **测试行为而非实现**：关注输入/输出，不关注内部实现细节
3. **测试命名**：`should_{预期行为}_when_{条件}`
4. **测试独立性**：每个测试用例独立运行，不依赖执行顺序
5. **CI 集成**：所有测试在 PR 合并前自动运行
