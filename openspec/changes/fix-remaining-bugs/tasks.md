## 1. 后端：驳回后重新提交端点（BUG-13）

- [x] 1.1 新增 `ResubmitRequest { formData, @Valid familyMembers }` DTO；`ParticipationService.resubmit(userId, participationId, request)`：仅 REJECTED→RE_SUBMITTED（其余状态抛 400「当前状态不可重新提交」）、活动 ENDED 拒绝、`activityRepository.findByIdWithLock` 名额校验（占用名额 + 1 + 家属数 ≤ 上限）、更新 formData/familyMembers、保留 rejectReason；controller 新增 `PATCH /api/v2/participations/{id}/resubmit` —— 验证：`ParticipationServiceImplTest` 新增用例覆盖成功/非 REJECTED/名额已满三种路径，`mvn test -pl csr_magic_backend` 相关用例通过
- [x] 1.2 前端 `participationApi` 新增 `resubmit(id, data)`；`ActivityDetailPage.handleSignup` 在 participation.state === 'REJECTED' 且 showResubmitForm 时改调 resubmit（否则保持 signup），失败仍抛后端 message 给表单展示 —— 验证：SignupForm/ActivityDetailPage 相关 vitest 用例通过（mock resubmit 断言调用与成功 toast）

## 2. 后端：参与名额统一口径（BUG-06）

- [x] 2.1 `UserActivityRepository` 新增批量占用名额查询 `findOccupiedSlotsGroupedByActivity()`（GROUP BY activity_id 的 sum(1+家属数)）；`ActivityServiceImpl.list()` 用一次该查询构建 Map 填充每项 `currentParticipants/currentOccupiedSlots`，`getDetail()` 改用 `sumOccupiedSlots` 填充两字段（不再传行数） —— 验证：`ActivityServiceImplTest` 新增用例断言列表与详情口径一致（含家属占位场景），测试通过
- [x] 2.2 前端确认列表页/管理端活动列表直接透传 `currentParticipants` 展示（无前端改动的仅补充说明）；`ActivityListPage`/`ActivityManagementPage` 若存在本地覆写计数则移除 —— 验证：`npm test` 相关组件用例通过，`ActivityCard` 显示值与接口数据一致

## 3. 后端：删除活动/事件明确报错（BUG-11 + 同族一致化）

- [x] 3.1 `AiPosterRepository` 新增 `countByActivityId`；`ActivityServiceImpl.delete()` 预检报名记录与海报记录数，任一 > 0 抛 `BusinessException(400, "该活动下还有 N 条报名/海报记录，请先处理后再删除")`（数量为两类之和并分项说明）；`ActivityController` 无需改动 —— 验证：`ActivityServiceImplTest` 新增删除含记录被拒（断言 400 文案）与无记录删除成功用例，通过
- [x] 3.2 `EventServiceImpl.delete()` 同样预检该事件下活动数，> 0 抛 400 「该事件下还有 N 个活动，请先处理后再删除」 —— 验证：`EventServiceImplTest` 新增对应用例，通过

## 4. 前端：退出确认框、家属校验与回显（BUG-02 / BUG-07 / BUG-08）

- [x] 4.1 移除 `ActivityDetailPage` 中 `window.confirm`，实现 `WithdrawConfirmModal`（遮罩 + 卡片 + 确认/取消 + 退出中禁用态，样式与 admin 删除确认框一致） —— 验证：`npm test` 新增/更新用例覆盖确认与取消两条路径，且全仓无 `window.confirm` 引用
- [x] 4.2 `SignupForm.validate()` 增加家属行姓名非空校验（空行置「家属姓名不能为空」错误并阻止提交），`handleSubmit` 移除静默 `filter`；`FamilyMembersInput` 增加错误态红框/文案展示 —— 验证：`SignupForm.familyCompanion.test.tsx` 新增空姓名提交被拦截用例，通过
- [x] 4.3 `ParticipationStatus` 在「已提交信息」下新增「携带家属」回显块（家属姓名 + 关系中文标签，取 `participation.familyMembers`；前端 `types/participation.ts` 若无该字段则补齐） —— 验证：对应组件测试断言家属信息渲染，通过

## 5. 前端：注册/登录守卫与性别口径（BUG-03 / BUG-04 / BUG-05 / BUG-09）

- [x] 5.1 新增 `PublicOnlyRoute`（已认证 → 重定向 `/`），`App.tsx` 用它包裹 `/register` 与 `/login` 路由 —— 验证：`App.test.tsx` 新增登录态访问注册/登录页被重定向用例，通过
- [x] 5.2 `RegisterPage` 性别 radio value 改为 `MALE`/`FEMALE`（文案仍「男/女」） —— 验证：`RegisterPage` 相关测试/`authApi.test.ts` 断言请求体含枚举值，通过
- [x] 5.3 `ProfileInfoForm` 对 `user.gender` 旧值「男/女」做兼容映射（→ MALE/FEMALE）后再作为 select 默认值与提交值 —— 验证：新增组件测试覆盖存量「男」值正确显示且保存不回归为「不设置」，通过
- [x] 5.4 注册回归测试：mock `authApi.register` 409 时页面展示「用户名已存在」（不作为静默失败）；不选性别提交成功 —— 验证：`RegisterPage` 相关用例通过

## 6. 前端：管理端角色门禁与删除报错展示（BUG-10 代码侧 / BUG-11 前端）

- [x] 6.1 `AdminLayout` 增加角色守卫：非 ADMIN 用户 `<Navigate to="/" replace/>` —— 验证：`AdminLayout.test.tsx` 新增 USER 角色被重定向、ADMIN 正常渲染用例，通过
- [x] 6.2 `ActivityManagementPage` 删除失败时从 `response.data.message` 提取后端错误并在确认框内展示（新增 error state），成功后关闭模态刷新列表 —— 验证：对应组件测试断言失败路径显示后端文案且模态不关闭，通过
- [x] 6.3 管理端深链接会话回归：e2e 或组件级用例验证「登录态刷新 /admin/participations 不跳登录页」「无会话访问跳转 /login」 —— 验证：用例执行通过

## 7. 前端：海报分享反馈与防重复（BUG-12 / P05）

- [x] 7.1 `AIPosterStudioPage` 实现「分享到动态」handler：fetch 海报 Blob → `navigator.share({files,...})`；AbortError（用户取消）静默；不支持/失败降级 `navigator.clipboard.writeText(海报同源 URL)` + toast「海报链接已复制」；均失败给错误 toast；生成/分享提示补 `aria-live` 便于读屏感知 —— 验证：组件测试 mock `navigator.share`/clipboard 覆盖成功、取消、降级、失败四路径，通过
- [x] 7.2 `handleGenerate` 增加 `generatingRef` 锁（首行短路，finally 复位）杜绝快速双击双任务 —— 验证：组件测试连点两次断言仅发起一次 `posterApi.generate`，通过

## 8. 前端：头像取字净化（观察 10）

- [x] 8.1 新增 `src/utils/avatar.ts` `getAvatarInitial(name, fallback?)`（取首个 `\p{L}\p{N}` 字符，无则回退 'U'）并配单测 —— 验证：单元测试覆盖 `<b>加粗姓名</b>` → 首个有效字符、空值回退，通过
- [x] 8.2 替换 4 处 `charAt(0)`：`UserAvatarDropdown.tsx`、`EmployeeLayout.tsx`、`dashboard/TopParticipantsList.tsx`、`admin/ParticipationPage.tsx:192` —— 验证：相关组件测试通过，`npm test` 无回归

## 9. 整体验证与归档准备

- [x] 9.1 前端全量：`npm test`（vitest 全绿，含新增用例）、`npm run build` 成功、无 TS 错误 —— 验证：命令退出码 0（166/166 用例通过 + vite build 成功）
- [x] 9.2 后端全量：`mvn test`（或 `mvn package`）全绿 —— 验证：`mvn test -Dtest=!ApiIntegrationTest` 退出码 0（207 用例通过）、`mvn package -DskipTests` 退出码 0。**备注**：`ApiIntegrationTest`（@SpringBootTest，连真实 dev 数据库）中 8 项失败为**既有环境问题**——该测试依赖手工预置的 `zhangsan` 管理员账号（仓库内无任何种子 SQL），当前本地库缺少该数据导致 login 401 并级联 401/201 断言失败；与本次改动无关（改动未触及 auth 链路）
- [x] 9.3 按黑盒报告 BUG-02、06、07、08、09、11、12、13 与 BUG-03/04/05 回归逐项代码级核查（每项给出对应的 spec 场景与测试用例映射汇总） —— 验证：输出核对清单，全部勾选
- [x] 9.4 运行 `openspec validate --changes fix-remaining-bugs` 通过；补充说明运维侧（旧 /admin 移除）留待后续处理 —— 验证：validate 输出 ✓