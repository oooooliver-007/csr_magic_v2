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

**展示前必须检查依赖实现状态**：
1. 对每个功能，读取其"依赖"列标注的前置模块/功能
2. 通过检查代码目录（如 `csr_magic_backend/src/main/java/com/csr/{dep_module}/`）判断依赖是否已实现
3. 在展示功能列表时，**明确标注每个功能的依赖及其实现状态**

展示格式示例：
```
请选择要实现的功能：
1. activity-crud — 活动 CRUD（管理端）
   ⚠️ 依赖：event（❌ 未实现）— 需先实现 event-crud
2. activity-list — 活动列表（员工端）
   依赖：event（✅ 已实现）
```

### 1.4 依赖检查与强制执行（MUST）

用户选择功能后，**必须执行以下依赖检查**，这是硬性规则，不可跳过：

1. 检查所选功能的 `depends_on` 和 `_index.md` 中声明的前置依赖
2. 对每个依赖，检查对应代码目录是否存在实现（后端包目录 + 前端页面文件）
3. **如果存在未实现的依赖**：
   - 明确告知用户：「功能 X 依赖 Y，但 Y 尚未实现。必须先实现 Y。」
   - **自动切换到依赖模块的实现流程**：回到阶段 1.2，将目标模块切换为依赖模块
   - 依赖模块实现完成后，再回到原功能继续实现
   - **禁止**在未完整实现依赖的情况下开始当前功能的编码
4. 如果所有依赖均已实现，正常进入阶段 2

> **规则**：依赖必须先于被依赖者实现，无例外。这确保了代码的 FK 关系、API 调用链和前端数据源都有完整的基础支撑。

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
6. **Checkpoint 去重读取**：如果当前会话来自 Checkpoint 续接（即 Session Summary 中已列出 viewed/edited 文件），
   对于已在 Summary 中标注内容和 learnings 的文件，**不再重复读取**，直接使用 Summary 中的信息。
   仅当需要验证最新内容（如文件可能被外部修改）时才重新读取。
7. **大文件编辑策略**：对于超过 80 行的文件修改，优先使用 `multi_edit`（多点精确替换）而非整体替换。
   整体替换仅用于新建文件或文件结构发生根本性变化的场景。
8. **并行工具调用**：无依赖关系的读取操作（如同时读取 spec 和 design 文件）必须并行执行，
   减少轮次数量。但写操作（edit/create）必须串行，确保顺序正确。

### 3.2 子流程参考

当 Checklist 步骤涉及新增 API 端点或新增数据库表时，读取 `references/sub-procedures.md` 获取标准子步骤。

### 3.3 文档同步更新

编码过程中，如涉及以下操作，必须同步更新对应文档：

| 操作 | 更新文档 |
|------|---------|
| 新增 API 端点 | `docs/shared/api-contracts.md` |
| 新增/修改数据表 | `docs/shared/data-models.md` |
| 重要技术决策 | `agent.md` 的 Decision Log |

### 3.4 单元测试（MUST — 禁止跳过）

> **硬性规则**：Checklist 编码步骤完成后，**必须**生成单元测试并执行通过，才能进入阶段 4 验收。

**TODO 列表管理规则**（创建 TODO 列表时必须遵守）：
1. 「生成并运行单元测试」必须作为**独立 TODO 项**
2. 「Playwright E2E 测试」必须作为**独立 TODO 项**，且不得标记为完成直到实际执行
3. 「验收标准自检」必须作为**独立 TODO 项**
4. 禁止将以上三项合并为一个 TODO，以防止执行过程中被跳过
5. **禁止遗留未完成 TODO**：所有 TODO 项必须全部完成才能输出最终报告，
   不得以"待启动服务后执行"等理由将 E2E 测试标记为完成或挂起
6. **NEVER 替换或删除未完成的 TODO 项**：如需新增任务（如文档更新），
   必须**追加**为新的 TODO 项，禁止覆盖已有的 pending/in_progress 项

Checklist 所有编码步骤完成后，为本次实现的代码生成单元测试：

#### 后端单元测试（JUnit 5 + Mockito）
- 路径：`csr_magic_backend/src/test/java/com/csr/{module}/`
- **Service 测试**：测试核心业务逻辑（正常流程 + 异常流程），使用 `@MockitoBean` mock 依赖
- **Controller 测试**：使用 `@WebMvcTest` + `MockMvc` 测试 HTTP 请求/响应、状态码、参数校验
  - **必须包含权限配置测试**：不能只用 `addFilters=false` 绕过 Security Filter，还需验证 SecurityConfig 中 `permitAll` / `authenticated` / `hasRole` 路径配置是否正确
  - **边界场景**：无 Token 访问受保护端点应返回 401；无 Token 访问 permitAll 端点应正常
- 命名规范：`{ClassName}Test.java`（如 `AuthServiceImplTest.java`、`AuthControllerTest.java`）

#### 前端单元测试（Vitest + React Testing Library）
- 路径：`csr_magic_frontend/src/__tests__/` 或组件同目录 `*.test.tsx`
- **组件测试**：测试渲染输出、用户交互、表单验证、错误提示
- **Store 测试**：测试 Zustand store 的 action 和状态变更
- **Service 测试**：测试 API 调用封装（mock axios）
- 命名规范：`{ComponentName}.test.tsx` 或 `{serviceName}.test.ts`

生成测试后**必须立即执行**并确保全部通过（不得推迟到阶段 4）：
- 后端：`mvn test -pl csr_magic_backend`
- 前端：`npx vitest run`
- **如果测试失败，必须修复后重新运行，直到全部通过才能继续**

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

### 4.2 Playwright 端到端测试（MUST — 禁止跳过）

> **硬性规则**：**必须**执行 Playwright E2E 测试，不得仅凭单元测试通过就跳过此步。
> 禁止在未启动前后端服务、未执行 Playwright 测试的情况下进入 4.3 Gate Check。

**调用 `e2e-test` Skill 执行本阶段**。具体步骤参见该 Skill 的阶段 1→4：

1. **环境准备**：确认 Playwright CLI 已安装、Chromium 已下载、playwright.config.ts 和 global-setup.ts 已配置
2. **编写测试**：根据 spec-*.md 验收标准，在 `e2e/{feature}.spec.ts` 中编写测试场景
3. **启动服务并运行**：启动前后端 → `npx playwright test` → 收集结果
4. **输出报告**：以表格形式汇总每个测试场景的通过/失败状态

### 4.3 Gate Check — 进入验收前的强制校验

> **在执行 4.4 验收标准检查之前，必须逐项确认以下前置条件全部满足，否则禁止继续：**

| # | 检查项 | 验证方式 |
|---|--------|---------|
| 1 | 单元测试已执行且全部通过 | TODO 中「单元测试」项为 completed |
| 2 | E2E 测试文件已创建 | `e2e/{feature}.spec.ts` 文件存在 |
| 3 | E2E 测试已实际运行且结果已输出 | TODO 中「E2E 测试」项为 completed，且有 Playwright 输出记录 |

**如果任一项不满足，必须立即补执行，不得跳过。**

### 4.4 验收标准检查

逐项对照 spec-*.md 的验收标准，对每一项输出通过/未通过：
```
验收自检结果：
✅ [通过] 登录页正确渲染，包含用户名、密码输入框和登录按钮
✅ [通过] 注册页包含所有必填字段和验证
✅ [通过] Playwright E2E 测试全部通过
```

### 4.5 Guard Rails 最终检查

确认以下 Guard Rails 未被违反：
- [ ] 无 `any` 类型（TypeScript）
- [ ] 无硬编码 API Key / 密码 / URL
- [ ] 所有 API 调用通过 services/ 层封装
- [ ] 所有 API 调用有错误处理
- [ ] 无 mock 数据或 TODO 占位符
- [ ] 遵循现有代码的命名和分层模式

### 4.6 完成报告

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

## 环境与工具注意事项

- **PowerShell 兼容性**：Maven 的 `-D` 参数在 PowerShell 中需要引号包裹，如 `"-Dtest=com.csr.activity.**"`
- **数据库操作**：统一使用 `mcp1_query`（MCP DB-postgres）查询和修改数据，schema 为 `csr_v2`，表名需加前缀如 `csr_v2.users`
- **前端无代理配置**：`apiClient.ts` 的 `baseURL` 直连后端（如 `http://localhost:8080`），不经过 Vite 代理，因此 CORS 配置至关重要
- **Zustand 非持久化**：authStore 使用 `loadFromStorage()` 手动恢复，页面刷新后 store 默认为空，需由应用入口调用恢复
- **E2E 测试用 Playwright CLI**：本项目 E2E 测试通过 `npx playwright test` 运行，由 `e2e-test` Skill 提供标准流程
