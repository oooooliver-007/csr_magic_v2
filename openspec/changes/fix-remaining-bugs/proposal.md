## Why

黑盒测试报告（2026-09-02，73 用例）中除已修复的 5 项外，剩余 12 项缺陷（BUG-02~13）集中在三类问题上：**失败路径静默无反馈**（重提报名、删除带记录活动、分享海报、登录态注册共 4 处）、**数据口径不一致**（参与人数三处、家属名额未体现）、**交互降级**（原生 confirm、性别不同步、头像取字异常）。其中 BUG-13（驳回后无法重新提交）直接打断审核闭环，需优先修复。

## What Changes

- **报名重提闭环（BUG-13）**：新增员工端重提接口 `PATCH /api/v2/participations/{id}/resubmit`，将 REJECTED 记录转为 RE_SUBMITTED 并更新报名内容（表单数据 + 家属），重提前重新校验名额；前端「修改后重新提交」表单改走该接口，失败展示后端明确报错。
- **删除活动明确报错（BUG-11）**：后端删除前预检该活动下的参与记录与 AI 海报记录数量，存在时返回 `400` 明确中文错误（如「该活动下还有 N 条报名记录，请先处理后再删除」）；前端确认框内展示后端真实报错且不关闭模态框。
- **海报分享反馈（BUG-12）+ 生成防重复（P05）**：实现「分享到动态」——优先 Web Share API（携带海报图片），失败/桌面端降级为复制海报链接，均给 toast 反馈；生成按钮增加 ref 级防重复锁，杜绝快速双击产生两张海报。
- **参与人数口径统一（BUG-06 / 观察 11）**：活动列表与管理端列表不再把参与人数硬编码为 0，改为按「占用名额（含家属）」口径计算；详情页 currentParticipants / currentOccupiedSlots 统一使用 `sumOccupiedSlots`。三处显示一致。
- **家属校验与回显（BUG-07 / BUG-08）**：空姓名家属行改为表单校验错误提示（不再静默丢弃）；详情页「已提交信息」区块回显携带的家属名单。
- **退出活动自定义确认框（BUG-02）**：替换浏览器原生 `window.confirm()` 为站内自定义模态框，与管理端反馈规范一致。
- **性别口径统一（BUG-09）**：注册页面性别统一提交 `MALE`/`FEMALE`（UI 文案仍为「男/女」）；个人中心下拉兼容存量「男/女」历史值。
- **注册页防呆 + 回归验证（BUG-03 / BUG-04 / BUG-05）**：已登录用户访问 `/register` 直接重定向首页（同源修复已登录注册问题）；补充回归测试证明重复用户名 409 提示、性别可选注册均正常。
- **管理端角色门禁（BUG-10 代码侧）**：非 ADMIN 用户访问 `/admin/**` 重定向回首页；管理端深链接会话恢复补充回归测试。线上 `/admin` 被仓库外旧版管理端 SPA 遮蔽属运维问题（nginx/部署），本次不处理，仅记录说明。
- **头像取字过滤（观察 10）**：头像取字逻辑过滤非字母数字字符，`<b>加粗姓名</b>` 不再显示为「<」。

## Capabilities

> 项目尚无 `openspec/specs` 主规格（fix-5-bugs 的 delta 规格尚未归档同步），本次沿用平铺布局全部以新能力引入，与 fix-5-bugs 中同名领域的规格在归档后自然合并。

### New Capabilities

- `participation-flow`: 员工端报名/退出/家属/驳回重提的行为与参与名额口径（BUG-02/06/07/08/13）。
- `registration-profile`: 注册与个人资料的字段口径、登录态注册守卫、错误提示展示（BUG-03/04/05/09）。
- `admin-activity-management`: 管理端活动列表名额口径与删除活动的前置校验报错（BUG-06 管理端 / BUG-11）。
- `admin-session`: 管理端角色门禁与深链接会话恢复（BUG-10 代码侧）。
- `poster-studio`: 海报生成防重复与分享反馈（BUG-12 / P05）。
- `avatar-display`: 头像取字内容净化（观察 10）。

### Modified Capabilities

（无——主规格目录尚未建立，暂不声明修改）

## Impact

- **后端**：`ParticipationController` / `ParticipationService(Impl)`（新增 resubmit）、`UserActivityRepository`（按活动分组占用名额查询）、`ActivityServiceImpl`（list 名额口径、delete 预检）、`AiPosterRepository`（海报记录预检计数）。无数据库迁移（复用现有 RE_SUBMITTED 状态）。
- **前端**：`ActivityDetailPage`（自定义确认框、重提分支）、`SignupForm` / `FamilyMembersInput`（家属校验）、`ParticipationStatus`（家属回显）、`RegisterPage` / `ProfileInfoForm`（性别口径、登录态守卫）、`App` / `PrivateRoute` / `AdminLayout`（角色门禁）、`AIPosterStudioPage`（分享 + 防重复）、`ActivityManagementPage`（删除报错展示）、`ActivityCard` 及列表/管理端页面（名额口径）、`UserAvatarDropdown` / `EmployeeLayout` / `TopParticipantsList`（头像取字）、`participationApi` / `activityApi`。
- **测试**：后端跟随 controller/service 单测；前端 `npm test` 全量回归 + 新增用例；构建 `npm run build` + `mvn package`。
- **无 API 破坏性变更**；无依赖变更；无数据库迁移。