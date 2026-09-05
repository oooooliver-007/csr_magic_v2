## Why

员工端与管理端存在 5 个已确认的缺陷：移动端「报名」按钮无响应、AI 对话按钮跳转到首页、通知下拉在移动端不适配、密码错误不显示错误信息、Admin 端在移动端无自适应。这些问题直接影响核心报名链路与移动端体验，需要一次性修复。

## What Changes

- 修复员工端活动详情页**移动端报名无响应**：在移动端内联渲染报名表单，底部操作栏「报名」按钮滚动/定位到表单，使移动端可完成报名。
- **暂时隐藏**「AI 对话报名」按钮（桌面端报名卡 + 移动端底部栏）。AI 对话报名模块（`ai-chat-registration`）尚未实现，点击会因路由不存在而被兜底重定向到首页；本次仅移除错误入口，不实现该功能。
- 通知下拉组件适配移动端：窄屏下改为**全宽底部弹出 Sheet**（顶部圆角 + 遮罩点击关闭），桌面端保持现有下拉。
- 修复登录错误信息丢失：前端 API 拦截器仅对**携带 Authorization 的请求**执行 401→刷新逻辑；登录/注册等匿名请求的 401 直接返回给页面，正常展示「用户名或密码错误」等后端错误信息。
- Admin 端移动端自适应：管理端布局改为**汉堡菜单 + 抽屉侧边栏**（与员工端一致），桌面端保持固定侧栏；所有 Admin 页面在窄屏下呈现移动友好布局（工具栏、表格、筛选、弹窗、详情面板均需适配）。

## Capabilities

### New Capabilities
<!-- 项目尚未建立 openspec/specs 主目录，以下均为首次引入的能力（平铺布局，遵循项目模块命名习惯）。 -->
- `employee-activity-detail`: 员工端活动详情页行为，含移动端报名表单呈现与 AI 对话入口可见性。
- `notification`: 站内通知的呈现与交互，含移动端底部 Sheet 弹框。
- `admin-dashboard`: 管理端整体布局与移动端导航。

### Modified Capabilities
- `auth`: 登录失败错误信息必须可靠展示（后端错误透传，不被前端拦截器吞掉）。

## Impact

- **前端**：`ActivityDetailPage.tsx`、`SignupForm.tsx`、`NotificationBell.tsx`、`NotificationDropdown.tsx`、`services/apiClient.ts`、`components/AdminLayout.tsx`，以及各 `pages/admin/*` 页面与 admin 子组件。
- **后端 / AI 服务**：无改动（仅前端行为修复）。
- **行为影响**：移动端可正常报名；AI 对话入口暂不可见（模块未实现）；登录失败提示恢复；Admin 在窄屏可操作。
- **无 API 契约变更**；无数据库迁移。
