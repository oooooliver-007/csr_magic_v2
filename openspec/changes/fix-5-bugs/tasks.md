## 1. 登录错误信息透传（Bug 4）

- [x] 1.1 修改 `apiClient.ts` 响应拦截器：401 时若原请求未携带 Authorization 头（匿名请求）则直接 `Promise.reject(error)`，不进入刷新流程；验证手动输入错误密码后页面显示「用户名或密码错误」且不跳转
- [x] 1.2 运行前端测试套件（`npm test` 或等价命令），确认 `authApi.test.ts` 与既有拦截器相关测试全部通过，且无回归

## 2. 活动详情页移动端报名 + 隐藏 AI 对话入口（Bug 1 + Bug 2）

- [x] 2.1 在 `ActivityDetailPage.tsx` 移动端区域（`md:hidden`）内联渲染报名表单（复用 SignupForm / RegistrationCard 逻辑），验证窄屏下可看到并填写报名表单
- [x] 2.2 移动端底部操作栏「报名」按钮改为滚动定位到表单（替换纯 `window.scrollTo` 底部行为），验证点击后能到达可填写表单且不被底部栏遮挡
- [x] 2.3 移除桌面报名卡（RegistrationCard）与移动端底部栏（MobileBottomBar）中的「AI 对话报名」按钮及 `onNavigateChat` 调用链，清理「Or 分隔线」区块，代码内保留指向 `ai-chat-registration` 模块的 TODO 注释；验证页面不再渲染指向 `/activities/:id/chat` 的入口
- [x] 2.4 核对并运行 `ActivityDetailPage`/`SignupForm` 相关测试，必要时更新快照/用例，验证窄屏报名流程（含名额已满禁用）与桌面端行为均正常

## 3. 通知弹框移动端自适应（Bug 3）

- [x] 3.1 改造 `NotificationDropdown.tsx` 为响应式：桌面保持 `absolute right-0 top-full w-[360px]` 下拉，移动端切换为 `fixed inset-x-0 bottom-0 w-full`、顶部圆角、`max-h-[75vh]` 可滚动、内容不超出视口
- [x] 3.2 改造 `NotificationBell.tsx`：移动端渲染全宽遮罩，点击遮罩/关闭可收起 Sheet，桌面端行为不变；验证各断点下点击通知跳转、查看全部、未读角标均可用
- [x] 3.3 运行 `NotificationDropdown.test.tsx` 及通知相关测试，验证移动端 Sheet 与桌面端下拉两种形态均通过

## 4. Admin 端移动端自适应（Bug 5）

- [x] 4.1 改造 `AdminLayout.tsx`：桌面保留固定 `w-64` 侧栏（`hidden md:flex`），主区改为 `ml-0 md:ml-64`；移动端 header 增加汉堡按钮，实现遮罩 + 抽屉侧栏（复用 `menuItems`），选中菜单后收起；验证窄屏导航、遮罩点击收起、桌面端无回归
- [x] 4.2 压缩移动端 header 面包屑（仅显示当前页标题），验证与 `AdminReviewTodoBell` 在窄屏不重叠、待办入口可点击
- [x] 4.3 逐页核对 admin 页面（Dashboard/Event/Activity/Survey/Participation/User）移动端表现：工具栏（搜索/筛选/分页）、列表卡片（`md:hidden`）、弹窗（表单/详情/确认框）宽度不超视口、按钮可操作；修正发现的问题
- [x] 4.4 核对 `AdminLayout.test.tsx` 与 admin 页面测试，更新/补充用例，验证移动端抽屉与各页窄屏操作通过

## 5. 整体验证与归档准备

- [x] 5.1 运行前端完整测试套件与构建（`npm test` + `npm run build`），确认 5 项修复无回归、无 TS 错误
- [x] 5.2 按 5 个缺陷逐项验证：移动端报名（内联表单 + 底部栏定位）、AI 对话按钮消失（无 /chat 引用）、通知 Sheet（桌面下拉/移动底部 Sheet + 遮罩）、登录错误提示（匿名 401 透传）、Admin 移动导航（汉堡 + 抽屉 + 全宽抽屉）；自动化测试 132/132 通过 + 构建通过 + 代码级核查确认符合 spec 场景
