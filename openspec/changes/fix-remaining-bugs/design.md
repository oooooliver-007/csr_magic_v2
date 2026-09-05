## Context

现状与约束（动机见 `proposal.md`）：

- 黑盒报告 12 项缺陷根因均已定位到具体文件（proposal 已列）；其中 BUG-03/04/05 在当前 head 代码上**不应复现**（注册页已展示 serverError、gender 可空、JwtAuthFilter 对公开路由放行无效 token），以回归测试固化而非改动。
- 后端 `user_activity.activity_id` 与 `ai_poster.activity_id` 均为无级联外键 → 删除活动会抛 DataIntegrityViolation → 500 兜底文案。
- 报名名额校验已使用 `sumOccupiedSlots(1+家属)`，但展示口径三处不一致；`ActivityResponse.from(entity)` 硬编码 0。
- 状态机已预留 `RE_SUBMITTED`（review() 可审核、管理端筛选/待办已支持），但**没有任何端点设置该状态**。
- 前端头像取字、海报分享、退出确认分别存在 `charAt(0)`、无 onClick、`window.confirm` 三处直接问题。
- 线上 `/admin` 被仓库外旧管理端 SPA 遮蔽（nginx 层面），本 change 不做运维改动（用户已确认）。

## Goals / Non-Goals

**Goals:**

- 一套后端 + 前端改动闭合全部 12 项缺陷，保持「失败必有反馈、口径三处一致、状态机闭环」三条主线。
- 所有改动可被自动化测试覆盖（后端单测 + 前端 vitest），并保持 `npm run build` / `mvn package` 通过。

**Non-Goals:**

- 不做运维部署改动（移除旧 `/admin`、nginx 调整）。
- 不做报告「观察项」中的体验增强（搜索骨架屏、通知徽标延迟等），仅收头像取字与海报防重复两项。
- 不改数据库 schema（无迁移）；不改账号体系（邮箱/验证码/密码强度）。
- 不实现「动态/朋友圈」功能页（分享仅做能力反馈，见 Decisions）。

## Decisions

### D1 驳回重提专用端点（BUG-13）

`PATCH /api/v2/participations/{id}/resubmit`，Body 为新 DTO `ResubmitRequest { formData, @Valid familyMembers }`（不复用含 activityId 的 SignupRequest）。

- 状态机：仅 `REJECTED → RE_SUBMITTED`；其余状态返回 400「当前状态不可重新提交」。
- 重提前校验：活动未 ENDED；名额足够（`sumOccupiedSlots + 1 + 家属数 ≤ maxParticipants`）。
- 覆盖 `formData` 与 `familyMembers`；保留 `rejectReason`（供员工对照修改，下一轮审核自然覆盖）；不动 `reviewedBy/reviewedAt`（审计历史保留）。
- 并发安全：`activityRepository.findByIdWithLock`（与 signup 一致）。
- 备选（否决）：重调 signup —— 被 `existsByUserIdAndActivityId` 拒绝；先 delete 再 signup —— 丢失审计与通知历史且 withdraw 仅 PENDING 可退。故专用端点。

### D2 名额统一为「占用名额」口径（BUG-06 / O11）

- `sumOccupiedSlots` 为唯一展示口径。`UserActivityRepository` 新增 `findOccupiedSlotsGroupedByActivity()`（单条 GROUP BY 查询，避免列表 N+1）。
- `ActivityServiceImpl.list()`：一次查询构建 `Map<activityId, slots>`，为每项填充 `currentParticipants = currentOccupiedSlots = slots`（员工端与管理端共用此端点，两处同步修正）。
- `getDetail()`：改传 `(countByActivityId 不再使用)`，直接 `sumOccupiedSlots` 填两个字段（DTO 已支持 `from(entity, participants, occupiedSlots, ...)` 重载）。
- 报名时的容量校验逻辑**不变**（已用 sumOccupiedSlots）。

### D3 家属校验与回显（BUG-07 / BUG-08）

- `SignupForm.validate()`：对 `familyMembers` 中 `name.trim() === ''` 的行置 `familyMembers` 错误「家属姓名不能为空」，提交前拦截；`handleSubmit` 不再静默 filter。
- `FamilyMembersInput` 增加受控错误态（红框 + 文案）行级展示；移除空行仍允许（用户主动删除）。
- 回显：`ParticipationStatus` 在 FormDataDisplay 下方渲染「携带家属」块（姓名 + 关系中文标签，遍历 `participation.familyMembers`）。实现时确认前端 `types/participation.ts` 的 `Participation` 已含 `familyMembers`（后端 ParticipationResponse 已含）。

### D4 退出活动自定义确认框（BUG-02）

- 移除 `window.confirm`，在 `ActivityDetailPage` 内建 `WithdrawConfirmModal`：遮罩 + 居中卡片 + 确认/取消 + 退出中加载态；样式沿用站内（admin 删除确认框同款语言）。

### D5 性别枚举统一（BUG-09）

- `RegisterPage` 单选 value 改为 `'MALE'`/`'FEMALE'`（文案仍「男/女」）；后端 `User.gender` 存储枚举值。
- `ProfileInfoForm` 选项保持 MALE/FEMALE；`defaultValues`/`reset` 处增加兼容映射：`男→MALE`、`女→FEMALE`（存量数据），保存时回写枚举；注册后登录响应里的 gender 随之一致。
- 已 grep 确认管理端组件不使用 gender，无需改。

### D6 注册/登录页已认证守卫（BUG-04）

- 新增 `PublicOnlyRoute`（等价 PrivateRoute 的反向）：已认证 → `<Navigate to="/" replace/>`，包裹 `/register` 与 `/login`（登录页同源一致化，避免类似误入）。
- 登出路径：`authStore.logout()` 同步置空 → 守卫即时放行，无回归。

### D7 管理端角色门禁（BUG-10 代码侧）

- `AdminLayout` 顶部：`user.role !== 'ADMIN'` → `<Navigate to="/" replace/>`（不新增路由层级，最小改动）。
- 深链接会话恢复：现状已可用（PrivateRoute 读 localStorage），补回归测试固化（含「无会话 → /login」场景）。

### D8 删除活动明确报错（BUG-11）

- `ActivityServiceImpl.delete(id)`：删除前预检 `countByActivityId(id)` 与 `aiPosterRepository.countByActivityId(id)`（无此方法则新增），任一 > 0 → `BusinessException(400, "该活动下还有 N 条报名记录/海报记录，请先处理后再删除")`（数量取两种记录之和，文案说明）。
- 前端 `ActivityManagementPage`：删除失败时 `catch` 读取 `response.data.message` 展示在确认框内（新增 error state），**不关闭模态**；成功路径不变。
- **同族一致化（范围微扩，已在本 change 内声明）**：`EventServiceImpl.delete` 同样预检活动数（`event` 下活动 FK 无级联），返回「该事件下还有 N 个活动…」——与 BUG-11 同一根因模式，低成本消除另一个静默 500。
- 兜底：极端竞态下仍可能 DataIntegrityViolation → GlobalExceptionHandler 兜底 500 文案（可接受）。

### D9 海报分享 + 防重复（BUG-12 / P05）

- 分享 handler：`fetch(generatedImageUrl)` 得 Blob → `navigator.share({ files: [File], title, text })`；捕获 `AbortError`（用户取消）静默；`navigator.share` 不存在或抛非取消错误 → `navigator.clipboard.writeText(同源 URL)` → toast「海报链接已复制」；全部失败 → 错误 toast。
- 防重复：`generatingRef`（useRef 布尔锁）置于 `handleGenerate` 首行，`finally` 复位；与现有 `isGenerating` 禁用双保险。
- 备选（否决）：跳转独立动态页 —— 不存在该功能页，属新功能而非缺陷修复。

### D10 头像取字净化（O10）

- 新增 util（如 `src/utils/avatar.ts`）`getAvatarInitial(name, fallback)`：取首个 `\p{L}\p{N}` 字符（含 CJK），无则 `fallback ?? 'U'`。
- 替换 4 处 `charAt(0)`：`UserAvatarDropdown`、`EmployeeLayout`、`TopParticipantsList`、`ParticipationPage:192`。

## Risks / Trade-offs

- [名额口径变化会改变既有显示数字（携带家属后显示变大）] → 预期行为，与页面文案「家属将与您一起占用活动名额」一致，报告中即建议此口径。
- [列表名额 COUNT 新 SQL（JSONB_ARRAY_LENGTH GROUP BY）] → 平台数据量小且已用 JSONB 函数（signup 校验已用），无性能风险。
- [resubmit 并发双击] → 状态机天然幂等：第二次进入时状态已非 REJECTED，返回明确 400。
- [Web Share 兼容性波动] → 复制降级 + toast 覆盖；取消（AbortError）不误报为失败。
- [删除预检与并发插入竞态] → 兜底 500 文案，可接受；管理端流程上先处理记录再删除。
- [/login 行为由「可访问」变为「重定向」属轻微行为变化] → 与 BUG-04 同根，避免登录态误入歧途，风险低。

## Migration Plan

- 无数据库迁移；无新依赖。
- 部署顺序：后端先（新增 resubmit/预检端点，旧前端不受影响），前端后（npm run build + 部署）。回滚：前端回滚即恢复旧交互（后端新端点闲置无害）；后端回滚需连同前端一起（否则重提回归静默失败，但不阻塞主流程）。
- 运维备注（不在本 change 执行，用户已确认）：删除服务器旧 `/admin` 静态目录或调整 nginx `location /admin` 指向新 dist，统一 SPA 的 /admin 路由才能生效（BUG-10 线上根因）。

## Open Questions

无。