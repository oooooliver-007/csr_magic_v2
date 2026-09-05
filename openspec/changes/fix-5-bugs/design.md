## Context

当前状态与约束（动机见 proposal.md）：项目为 Vite + React 19 + TailwindCSS 4 前端，移动端断点以 `md`（768px）为主，既有代码风格大量使用 `md:` 前缀做同一 DOM 响应式切换。5 个缺陷均在前端层，后端与 AI 服务无改动。AI 对话报名模块（`ai-chat-registration`）在设计文档中存在但三端均未实现。

## Goals / Non-Goals

**Goals:**
- 移动端（窄屏）报名链路可用：详情页内联报名表单 + 底部操作栏引导
- 隐藏未实现功能的错误入口，消除"跳首页"体验
- 通知弹框与 Admin 端在窄屏下的可用性与视觉适配
- 登录失败错误信息可靠透传
- 全部方案遵循既有代码风格（同一 DOM + Tailwind 断点切换），不引入新依赖

**Non-Goals:**
- 不实现 AI 对话报名功能（本次仅隐藏入口，不开发 chat-ui / agent-flow）
- 不改后端、AI 服务与 API 契约
- 不做全站性的响应式重构（仅覆盖员工端详情页、通知、Admin 端）

## Decisions

### D1: 移动端报名表单"内联渲染 + 底部栏滚动定位"（Bug 1）
- **方案**：在 `ActivityDetailPage` 中，移动端（`md:hidden`）于活动详情下方直接渲染 `RegistrationCard`/`SignupForm`；底部固定栏「报名」按钮行为从 `window.scrollTo` 改为滚动到表单锚点（或展开），移动端不依赖 `hidden md:block` 的桌面粘性卡。
- **理由**：报名表单只需一套组件，移动端复用同一 SignupForm，避免维护两套表单。
- **备选**：移动端底部弹出报名 Sheet —— 交互更重，报名表单字段多（动态表单 + 家属），内联滚动更简单、更符合"桌面/移动共用表单"的既有模式（活动详情移动端已有 `pb-24` 预留底部栏空间）。

### D2: AI 对话按钮直接移除，不实现功能（Bug 2）
- **方案**：删除 `RegistrationCard` 与 `MobileBottomBar` 中的「AI 对话报名」按钮及其 `onNavigateChat` 调用链，代码内保留 TODO 注释指向 `ai-chat-registration` 模块。不新增路由。
- **理由**：功能未实现，任何"保留按钮 + 禁用/提示"方案都会多出未使用的文案与分支；直接隐藏最干净，且符合用户确认的"暂时把按钮藏掉"。
- **备选**：按钮保留并弹"功能开发中"toast —— 增加无效状态，等模块实现时仍需删除，选择直接隐藏。

### D3: 通知弹框单一组件响应式，移动端全宽底部 Sheet（Bug 3）
- **方案**：`NotificationDropdown` 保持单一组件，通过 Tailwind 断点切换：
  - 桌面：`absolute right-0 top-full w-[360px]`（现状不变）
  - 移动：`fixed inset-x-0 bottom-0 w-full`、顶部圆角、`max-h-[75vh]` 可滚动、上方透明遮罩（点击收起）
  - `NotificationBell` 负责移动端遮罩渲染与关闭逻辑（点击遮罩/关闭 → `setOpen(false)`）
- **理由**：同一 DOM 响应式切换符合项目既有风格，无需 matchMedia/两套组件；移动端全宽 Sheet 是移动端通知面板的常见模式，避免下拉被视口截断。

### D4: 登录 401 不再触发刷新，错误透传（Bug 4）
- **方案**：`apiClient.ts` 响应拦截器在遇到 401 时，先判断**原请求是否携带 Authorization 头**：未携带（即匿名请求，如登录/注册）→ 直接 `Promise.reject(error)`，让页面展示后端 `message`；携带（已认证请求）→ 维持既有 Token 刷新流程。
- **理由**：以"是否有 Authorization 头"判定比硬编码 URL 更通用，天然覆盖 login/register 及未来匿名端点；不改后端即可让「用户名或密码错误」正常展示。
- **备选**：拦截器按 URL 白名单（`/auth/login`、`/auth/register`）跳过 —— 需维护列表，遗漏风险高，故不采用。

### D5: Admin 端"汉堡按钮 + 抽屉侧边栏"（Bug 5）
- **方案**：`AdminLayout` 改造：
  - 桌面（`md:`）：现有固定 `w-64` 侧栏（`hidden md:flex`）+ 主区 `md:ml-64` 不变
  - 移动：顶部 header 显示汉堡按钮（`md:hidden`），点击滑出抽屉侧栏 + 遮罩；侧栏 DOM 复用同一 `menuItems`
  - 主内容区在移动端不设左 margin（`ml-0 md:ml-64`）
  - 顶部面包屑在移动端压缩为仅当前页标题，保证与 AdminReviewTodoBell 不重叠
- **理由**：与员工端（EmployeeLayout）交互模式一致；抽屉复用同一菜单数据源，状态单一。
- **逐页适配**：admin 各页已有 `md:hidden`/`hidden md:block` 移动卡片（Activity/Event/Participation/User/Survey），本次核对并补齐工具栏（筛选/搜索/分页）、弹窗（表单/详情/确认框）、用户详情侧栏等窄屏表现，保持统一风格。

## Risks / Trade-offs

- [移动端报名表单内联后页面变长，用户可能找不到表单] → 底部「报名」按钮滚动定位 + 按钮文案变化反馈；保留 `pb-24` 防遮挡
- [通知 Sheet 与底部栏（如有）同时存在时重叠] → 员工端详情页底部操作栏仅在该页存在，通知铃铛在 header，Sheet 为 `fixed` 全宽，通过 z-index 分层确认无重叠
- [Admin 抽屉遮罩层级与弹窗冲突] → 抽屉遮罩使用低于弹窗的 z-index，并保证选中菜单后关闭抽屉
- [401 判定逻辑变更影响既有刷新行为] → 判定条件为"原请求无 Authorization 头"，已认证请求行为完全不变，回归风险集中在匿名端点
- [按钮隐藏后桌面报名卡布局变化] → 移除按钮后报名卡仅剩表单，"Or 分隔线"及按钮区块一并清理，保持视觉整洁

## Migration Plan

- 纯前端改动，无数据库迁移、无 API 变更。
- 按 Bug 4（apiClient）→ Bug 1/2（详情页）→ Bug 3（通知）→ Bug 5（Admin）顺序实施，每项可独立验证。
- 回滚：git revert 前端相关 commit 即可，无状态迁移。
