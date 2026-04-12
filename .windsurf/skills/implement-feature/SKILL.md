---
name: implement-feature
description: |
  CSR Magic 项目功能实现 Skill。交互式引导用户选择模块和功能，自动加载 6 层渐进式上下文，
  按 Implementation Checklist 自动编码，最后对照验收标准自检。
  当用户提到"实现功能"、"开发功能"、"implement feature"、"开始编码"、"做某个模块"、
  "实现某个页面"、"开发某个 API"等与 CSR Magic 功能开发相关的表述时，使用此 Skill。
  即使用户只是说"做活动列表"或"实现登录"这样简短的请求，也应触发此 Skill。
---

# CSR Magic — 功能实现 Skill

你是 CSR Magic 项目的 AI 开发工程师。本 Skill 指导你通过交互式选择、渐进式上下文加载、
自动编码和验收自检完成一个完整功能的实现。

## 阶段 1：交互式选择模块与功能

### 1.1 读取项目导航

读取 `agent.md`，从"模块索引"表格中提取 10 个模块信息。

### 1.2 让用户选择模块

向用户展示模块列表，让用户选择要实现的模块。展示格式：

```
请选择要实现的模块：
1. auth — 认证（登录/注册、JWT 认证）
2. event — 事件管理（事件 CRUD）
3. activity — 活动（列表、详情+报名、CRUD、模板系统）
4. participation — 参与（报名/退出）
5. dashboard — 数据看板（统计图表）
6. notification — 通知（站内通知系统）
7. user-management — 用户管理（用户 CRUD）
8. user-profile — 个人中心（个人设置、参与记录）
9. ai-poster — AI 海报（海报工作台、海报画廊）
10. ai-chat-registration — AI 对话报名（对话界面、Agent 流程）
```

如果速查表需要更新，参考 `references/modules-quick-ref.md`。

### 1.3 让用户选择功能

读取用户所选模块的 `docs/modules/{module}/_index.md`，从"功能清单"表格中提取功能列表。
向用户展示功能列表（含状态和依赖信息），让用户选择要实现的功能。

如果功能有前置依赖且依赖尚未实现，警告用户并建议先实现依赖。

## 阶段 2：渐进式上下文加载

用户选择功能后，按以下顺序加载 6 层上下文。每层加载后简要确认已读取。

### Layer 1：规则层
- 读取根 `.windsurfrules`（全局规则 + Guard Rails）
- 根据 design 文件的 `services` 字段，读取对应服务的 `.windsurfrules`

### Layer 2：项目全景
- 读取 `agent.md`（已在阶段 1 读取，确认技术栈和架构即可）

### Layer 3：模块概览
- 读取 `docs/modules/{module}/_index.md`（已在阶段 1 读取，确认依赖关系）

### Layer 4：功能规格（做什么）
- 读取 `docs/modules/{module}/spec-{feature}.md`
- 提取并记住 **验收标准** 列表（阶段 4 需要）

### Layer 5：技术设计（怎么做）
- 读取 `docs/modules/{module}/design-{feature}.md`
- 解析顶部 **Context Manifest**（YAML frontmatter）
- 提取 `requires_context` 列表、`services` 列表、`ui_prototype` 列表
- 提取底部 **Implementation Checklist**
- 提取 **UI 原型参考** 节（原型文件、行范围、关键 UI 元素）

### Layer 6：共享知识 + 参考实现 + UI 原型
- 按 Context Manifest 的 `requires_context` 列表，逐个读取所需的 shared docs
- 如果是该模块的首个功能实现，读取 `docs/exemplar/` 下的参考实现：
  - `exemplar-overview.md`（使用说明）
  - `exemplar-frontend.md`（前端参考，若涉及前端）
  - `exemplar-backend.md`（后端参考，若涉及后端）
- 如果 Context Manifest 中声明了 `ui_prototype`，读取对应原型文件的指定行范围
  - 原型代码是 UI 交互设计的权威参考，前端实现必须遵循其布局、配色和交互模式

加载完成后，向用户输出一段简要的上下文摘要：
```
✅ 上下文加载完成
- 模块：{module}（{module_name}）
- 功能：{feature}（{feature_name}）
- 涉及服务：{services}
- 加载的 shared docs：{list}
- UI 原型：{prototype_file}:{lines}（如有）
- Implementation Checklist：{N} 步
- 验收标准：{M} 项
即将按 Checklist 开始编码...
```

## 阶段 3：按 Implementation Checklist 自动编码

### 3.1 执行规则

严格按照 design-*.md 底部 Implementation Checklist 的顺序执行，遵循以下规则：

1. **按序执行**：从第 1 步开始，逐步完成，不跳步
2. **遵循规范**：编码时遵循 `.windsurfrules` 和 `docs/shared/coding-standards.md`
3. **参考 Exemplar**：代码结构和模式参考 `docs/exemplar/` 中的样本
3a. **遵循 UI 原型**：前端页面必须参照 `UI_UX_prototype/` 中对应组件的布局、配色、交互模式
4. **Guard Rails 检查**：每步编码后自查是否违反 Guard Rails：
   - 无 `any` 类型（TypeScript）
   - 无硬编码密钥/URL
   - API 调用通过 services/ 层
   - 有错误处理
   - 无 mock 数据
5. **更新进度**：每步完成后在 design-*.md 中将 `[ ]` 改为 `[x]`

### 3.2 子流程参考

当 Checklist 步骤涉及新增 API 端点或新增数据库表时，读取 `references/sub-procedures.md` 获取标准子步骤。

### 3.3 文档同步更新

编码过程中，如涉及以下操作，必须同步更新对应文档：

| 操作 | 更新文档 |
|------|---------|
| 新增 API 端点 | `docs/shared/api-contracts.md` |
| 新增/修改数据表 | `docs/shared/data-models.md` |
| 重要技术决策 | `agent.md` 的 Decision Log |

### 3.4 单元测试

Checklist 所有编码步骤完成后，为本次实现的代码生成单元测试：

#### 后端单元测试（JUnit 5 + Mockito）
- 路径：`csr_magic_backend/src/test/java/com/csr/{module}/`
- **Service 测试**：测试核心业务逻辑（正常流程 + 异常流程），使用 `@MockBean` mock 依赖
- **Controller 测试**：使用 `@WebMvcTest` + `MockMvc` 测试 HTTP 请求/响应、状态码、参数校验
- 命名规范：`{ClassName}Test.java`（如 `AuthServiceImplTest.java`、`AuthControllerTest.java`）

#### 前端单元测试（Vitest + React Testing Library）
- 路径：`csr_magic_frontend/src/__tests__/` 或组件同目录 `*.test.tsx`
- **组件测试**：测试渲染输出、用户交互、表单验证、错误提示
- **Store 测试**：测试 Zustand store 的 action 和状态变更
- **Service 测试**：测试 API 调用封装（mock axios）
- 命名规范：`{ComponentName}.test.tsx` 或 `{serviceName}.test.ts`

生成测试后执行并确保全部通过：
- 后端：`mvn test -pl csr_magic_backend`
- 前端：`npx vitest run`

### 3.5 进度报告

每完成 Checklist 中的一步，输出简要进度：
```
✅ Step {N}/{Total}: {step_description}
```

## 阶段 4：验收自检

所有 Checklist 步骤完成后，执行验收自检：

### 4.1 单元测试检查

确认单元测试全部通过：
- 后端：`mvn test` 全部绿色
- 前端：`npx vitest run` 全部绿色
- 输出测试覆盖率摘要

### 4.2 Playwright 端到端测试

启动前后端服务后，使用 Playwright MCP 执行端到端测试：

1. **启动服务**：确认后端（端口 8080）和前端（端口 3000）正常运行
2. **测试场景设计**：根据 spec-*.md 验收标准，设计对应的 E2E 测试场景，至少覆盖：
   - 页面渲染正确性（UI 元素存在）
   - 正常业务流程（提交表单、跳转、数据展示）
   - 异常流程（表单验证、错误提示、权限拦截）
   - 响应式布局（如需要）
3. **执行测试**：使用 `mcp7_browser_navigate`、`mcp7_browser_snapshot`、`mcp7_browser_run_code` 等工具执行
4. **输出结果**：以表格形式汇总每个测试场景的通过/失败状态

### 4.3 验收标准检查

逐项对照 spec-*.md 的验收标准，对每一项输出通过/未通过：
```
验收自检结果：
✅ [通过] 登录页正确渲染，包含用户名、密码输入框和登录按钮
✅ [通过] 注册页包含所有必填字段和验证
✅ [通过] Playwright E2E 测试全部通过
```

### 4.4 Guard Rails 最终检查

确认以下 Guard Rails 未被违反：
- [ ] 无 `any` 类型（TypeScript）
- [ ] 无硬编码 API Key / 密码 / URL
- [ ] 所有 API 调用通过 services/ 层封装
- [ ] 所有 API 调用有错误处理
- [ ] 无 mock 数据或 TODO 占位符
- [ ] 遵循现有代码的命名和分层模式

### 4.5 完成报告

输出最终完成报告：
```
🎉 功能实现完成
- 模块：{module} / 功能：{feature}
- Checklist：{completed}/{total} 步完成
- 单元测试：后端 {N} 个 ✅ / 前端 {M} 个 ✅
- Playwright E2E：{P}/{Q} 场景通过
- 验收标准：{passed}/{total} 项通过
- Guard Rails：全部通过 ✅
- 文档更新：api-contracts ✅ / data-models ✅ / decision-log ✅
```

## 重要提醒

- 本 Skill 的所有上下文文件位于 `docs/` 目录下，这些文件是你编码的唯一权威来源
- spec-*.md 定义"做什么"（稳定，不轻易修改）
- design-*.md 定义"怎么做"（可迭代，实现过程中可根据实际情况调整）
- 如果 design 中的方案与实际编码有冲突，优先遵循 design，必要时更新 design 并记录到 Decision Log
- 所有文档、注释使用中文；代码变量名、函数名、API 路径使用英文
