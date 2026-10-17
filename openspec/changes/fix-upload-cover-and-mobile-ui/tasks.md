> 1.x 已于 2026-10-17 完成并上线（本 change 立项前实施）；2.x–8.x 于同日实施完成，验证均为线上实测结果。

## 1. 部署基线与可构建性

- [x] 1.1 在 `participation/repository/UserActivityRepository.java` 补 `findByUserId` 与 `findByIdWithActivity`（均 `JOIN FETCH ua.activity`，满足 `open-in-view=false`）—— 验证：`mvn package -DskipTests` 退出码 0，无 `COMPILATION ERROR`
- [x] 1.2 从 `main` HEAD 重建前端与后端并部署上线 —— 验证：线上 `index.html` 引用 `index-53fiGQW9.js`（与本地构建同名）、jar 时间戳更新、`Started CsrMagicApplication`、`csr-backend` active
- [x] 1.3 校正后复测线上表现 —— 验证：`mobile-ui-check` 回归 6 页 390px 无横向溢出全绿；手机视口抽屉保存按钮位于 778–820px（视口内）
- [ ] 1.4 提交并推送修复到 `main`，使他人检出即可构建 —— **本地提交已完成（`92fb2f2`），推送被阻塞**：`git push origin main` 报 `Invalid username or token. Password authentication is not supported`（HTTPS remote 无可用凭据）。需配置 PAT / 改用 SSH remote，或由有权限者手动 push。验证：远端 `main` 包含该提交后，干净克隆执行 `mvn package -DskipTests` 通过

## 2. 反代请求体上限

- [x] 2.1 备份 `/etc/nginx/nginx.conf` 后，在承载 443 的 server 块内增加 `client_max_body_size 10m;` —— 验证：`nginx -t` 通过（备份 `/root/nginx.conf.bak-20261017-172432`，指令落在第 74 行）
- [x] 2.2 `systemctl reload nginx` 并确认新配置生效 —— 验证：`nginx -T | grep client_max_body_size` 输出 `10m`（不再落到默认 1MB）
- [x] 2.3 验证大于 1MB 的请求不再被反代拦截 —— 验证：2,000,015 B 请求体打到 `/api/v2/auth/login` 返回 `400 {"code":400,"message":"密码不能为空"}`，非 413
- [x] 2.4 在 `DEPLOYMENT.md` 记录「`sites-available/csr` 不生效、一律以 `nginx -T` 为准」及本次上限值 —— 验证：§6「nginx 修改纪律」与「请求体上限」两段已写入

## 3. 封面图上传（前端压缩）

- [x] 3.1 新增 `src/utils/imageCompress.ts`（canvas 缩放长边至 1600px、JPEG 0.82，超 400KB 逐级降质至 0.4），并替换两个抽屉的 `handleCoverUpload` —— 验证：上传 432,564 B 图片 → 预览 data URL 56,004 B / 1600×1200
- [x] 3.2 处理失败与超限分支（解码失败、压缩后仍超限、非图片类型）—— 验证：6,744,233 B 不可压缩噪声图 → 提示「图片压缩后仍超过 400KB，请换一张尺寸更小的图片」，未产生预览
- [x] 3.3 上传后立即预览、可删除重选不受影响 —— 验证：上传后 `img[alt="封面预览"]` 出现且文件输入移除；点击删除后预览消失、文件输入恢复
- [x] 3.4 端到端验证带封面的保存 —— 验证：线上创建活动 `POST /api/v2/activities` 返回 201（封面压缩后 19,707 B），随后 `DELETE` 返回 200，测试数据已清理

## 4. 失败反馈层级

- [x] 4.1 五个管理端页面的 toast 层级提升到 `z-[60]`（活动/事件/用户/参与审核/问卷管理）—— 验证：`elementFromPoint` 命中提示元素本身，`z-index` 计算值 60
- [x] 4.2 覆盖抽屉内的失败路径（校验失败、上传超限、接口报错）—— 验证：空表单保存 → 「请检查表单填写」可见且在最上层；上传超限提示同上

## 5. 抽屉页脚可见性

- [x] 5.1 `EventFormDrawer` 容器加 `overflow-hidden`、表单与滚动区加 `min-h-0` —— 验证：注入 2000px 填充后保存按钮仍在 778–820px（视口内），滚动区 `min-height: 0px` 且可滚动
- [x] 5.2 同法修正 `ActivityViewDrawer` 与 `EventViewDrawer` —— 验证：三者类名与 `ActivityFormDrawer` 完全一致，390×844 下无横向溢出
- [x] 5.3 与 `ActivityFormDrawer` 的类名对齐复核 —— 验证：grep 比对四个抽屉的 panel / 滚动区类名逐字相同

## 6. 封面图呈现（员工端）

- [x] 6.1 `ActivityCard` 与 `ActivityDetailPage` 的封面 `<img>` 增加 `object-top` —— 验证：卡片 `object-position: 50% 0%`（356×192 / 原图 1024×1024）；详情页 hero 同样为 `50% 0%`（390×256），与导航重叠 0px
- [x] 6.2 复核角标安全区与无封面占位未受影响 —— 验证：7 张卡片图中 8 张卡片 → 1 张走占位分支；角标位于 (12,12) 与右上角，尺寸 66×26 / 68×24，不侵入中部

## 7. 事件读权限

- [x] 7.1 移除 `EventController` 类级 `@PreAuthorize`，改为 `create`/`update`/`delete` 方法级 `hasRole('ADMIN')` —— 验证：后端编译通过；员工令牌 `GET /api/v2/events?size=5` 返回 200（3 条）
- [x] 7.2 验证写权限未被放宽 —— 验证：员工令牌 `POST /api/v2/events` 返回 403
- [x] 7.3 前端复核员工端活动列表页 —— 验证：`GET /api/v2/events` 200，控制台无 403，筛选下拉可填充

## 8. 验证与收尾

- [x] 8.1 部署后跑线上回归 `npx playwright test -c playwright.prod.config.ts mobile-ui-check` —— 验证：6 页无横向溢出 + 按钮配色/对齐断言全绿
- [x] 8.2 四项问题逐条复测 —— 验证记录见 §9
- [x] 8.3 `openspec validate fix-upload-cover-and-mobile-ui --strict` 通过 —— 验证：命令退出码 0

## 9. 四项问题复测结论

- **① 管理员端手机适配**：抽屉 panel 390×844、无横向溢出；6 个管理页回归全绿（部署基线校正生效）
- **② 封面上传无响应**：nginx 上限 1MB→10m、前端压缩到 ≤400KB、失败提示 z-60 可见 —— 带封面保存 201 通过
- **③ 抽屉按钮被藏**：四个抽屉页脚在注入超长内容后仍可见（778–820px）
- **④ 活动封面头部被切**：`object-position` 由 `50% 50%` 改为 `50% 0%`，卡片与详情页均保留原图上部
