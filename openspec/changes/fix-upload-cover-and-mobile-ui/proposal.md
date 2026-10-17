## Why

线上 `joy4giving.cn` 长期跑着一份**与仓库 `main` 不一致的前端构建**（2026-09-23 产物：含 10 月才合并的 chat 代码，却缺失 9/1 的移动端修复），管理员端手机布局因此完全崩坏；顺查这条线时又发现四个彼此独立的真实缺陷——封面图上传必然失败（nginx 生效配置无 `client_max_body_size`，实际默认 1MB；前端把图片转 base64 内联进 JSON；失败提示被抽屉盖住）、管理端三个抽屉缺少 flex 收缩约束会把页脚按钮顶出屏幕、员工端封面图被 `object-cover` 居中裁掉上部、员工端拉 `/api/v2/events` 恒 403。更根本的是：`main` 的后端自 2026-10-15 合并 `chatbox` 分支起**从未编译通过**，任何人都无法从 main 构建后端，这正是线上构建停留在 9/23 的原因。

## What Changes

- **部署基线校正（已实施）**：补齐 `UserActivityRepository` 缺失的 `findByUserId` / `findByIdWithActivity` 两个 JOIN FETCH 查询，使 `main` 后端可构建；从 `main` HEAD 重建前端与后端并部署，线上前端由 9/23 旧基线切换到 HEAD（验证：线上资产哈希变更、`md:ml-64`/`mobile-signup` 等 9/1 修复特征串回归、后端 27.21s 冷启动、重启后 0 条 ERROR）。
- **请求体上限（待实施）**：把 `client_max_body_size` 写进**真正生效**的 nginx server 块（`/etc/nginx/nginx.conf`），而不是目前这份被遮蔽的 `sites-available/csr`；同步修正部署文档中的配置归属说明。
- **封面图上传链路（待实施）**：上传前在浏览器端按最长边与体积做压缩/缩放，取代"原始文件直接 base64 内联"；对超限文件给出**可见**反馈；避免活动列表接口回传整张 base64 图片造成的响应体膨胀。
- **失败反馈层级（待实施）**：管理端操作失败提示改为不受抽屉遮挡的层级（Portal 或提高 z-index），杜绝"点了没反应"。
- **抽屉页脚可见性（待实施）**：`EventFormDrawer`、`ActivityViewDrawer`、`EventViewDrawer` 补齐 `overflow-hidden` + `min-h-0`，与已修好的 `ActivityFormDrawer` 对齐。
- **封面图呈现（待实施）**：员工端活动卡片与详情页主图不再居中裁切，保证图片上部（主体/标题区）可见。
- **员工端事件列表权限（待实施）**：让员工可读事件列表，修复活动筛选「所属事件」下拉恒为空且每次进页都报 403 的问题。

## Capabilities

### New Capabilities

- `deployment-ops`: 部署基线一致性（线上构建必须可由 `main` 构建，`main` 不得存在无法编译的状态）、nginx **生效配置**的请求体上限约束、部署后的可验证项。承接 `post-deploy-hardening` 引入的同名能力，本次 delta 只新增基线一致性与请求体上限场景。
- `admin-console-ui`: 管理端抽屉页脚的可见性约束、操作失败提示的可见性（不被抽屉遮挡）、封面图上传的前端约束（体积/尺寸/压缩）与反馈。承接 `post-deploy-hardening` 引入的同名能力。
- `activity-media`: 员工端活动封面图的呈现契约——卡片与详情页主图在常见原图比例下不得裁掉上部主体区域。
- `event-catalog`: 员工端可读取事件列表，作为活动筛选「所属事件」下拉的数据源。

### Modified Capabilities

（无——`openspec/specs` 主规格目录尚未建立，前序 change 的 delta 均未归档；本次 delta 在同名能力下自然合并。）

## Impact

- **前端**：`components/admin/EventFormDrawer.tsx`、`ActivityViewDrawer.tsx`、`EventViewDrawer.tsx`、`ActivityFormDrawer.tsx`（上传压缩）、`pages/admin/ActivityManagementPage.tsx`、`EventManagementPage.tsx`（提示层级）、`components/ActivityCard.tsx`、`pages/ActivityDetailPage.tsx`（封面呈现）。
- **后端**：`participation/repository/UserActivityRepository.java`（已改，未提交）、`event/controller/EventController.java`（员工读权限）。
- **运维**：阿里云 ECS `8.133.240.77` 的 `/etc/nginx/nginx.conf`（请求体上限）；`DEPLOYMENT.md` 配置归属说明。
- **数据**：无表结构变更；线上 Flyway 与仓库一致（V1–V13）。
- **测试**：复用 `e2e/prod/mobile-ui-check.spec.ts`；新增封面图上传与呈现的验证步骤。
- **兼容性**：无 API 破坏性变更；上传链路变更后历史 base64 封面仍可正常回显。
