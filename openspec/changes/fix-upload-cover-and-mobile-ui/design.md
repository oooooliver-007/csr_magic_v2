## Context

见 `proposal.md` - Why。当前实现的关键约束（均于 2026-10-17 在线上与仓库中核实）：

- 封面图以 **base64 data URL** 形式存在 `activity.cover_image`（PostgreSQL `TEXT`）与 `event.cover_image` 中，并由 `ActivityResponse.coverImage` 原样随列表接口返回。
- 反代生效配置是 `/etc/nginx/nginx.conf` 的 server 块；`client_max_body_size 20m` 只写在未被 include 的 `sites-available/csr`，`nginx -T` 输出里没有该指令 → 实际 1MB。
- 管理端抽屉的 z 序：遮罩 `z-40`、面板 `z-50`；页面 toast 为 `fixed z-50` 且渲染在抽屉**之前**（DOM 顺序决定层叠），因此被面板覆盖。
- `ActivityFormDrawer` 已有 `overflow-hidden` + `min-h-0`；`EventFormDrawer` / `ActivityViewDrawer` / `EventViewDrawer` 缺少这两处。
- 员工端封面容器固定比例（卡片 356×192 ≈ 1.85；详情 390×256 ≈ 1.52），图片用 `object-cover` 居中裁切；实测方形原图（1024×1024）时上部被裁约 17%~23%。
- `EventController` 为类级 `@PreAuthorize("hasRole('ADMIN')")`，映射在 `/api/v2/events`，而员工端 `ActivityListPage` 会调用它。

## Goals / Non-Goals

**Goals**

- 管理员端手机端可用性：抽屉页脚可达、失败必有可见反馈、封面上传在常见手机照片尺寸下成功。
- 员工端封面图不再出现"头部被切掉"的观感。
- 员工端活动筛选的事件下拉可用。
- 线上部署物与 `main` 一致，且 `main` 保持可构建状态。

**Non-Goals**

- 不引入对象存储或独立图片上传服务（留待后续 change）。
- 不改动活动/事件的数据模型与接口契约（`coverImage` 仍为字符串，兼容历史 base64 数据）。
- 不重做管理端整体设计系统，仅收敛上述可用性缺陷。

## Decisions

### 1. 封面图：前端压缩 + 保留 data URL 契约

上传时用 canvas 将长边缩放到上限像素（暂定 1600px）并以 JPEG 质量 0.82 重新编码，压缩后超过上限（暂定 400KB）再降质量一次；仍超限则给出可见错误。

- **为什么**：无需新增表/端点/存储方案，历史 base64 封面继续可读，改动面最小且当天可上线。
- **备选**：独立上传端点 + 返回 URL（与海报的 BYTEA 模式一致）。更彻底，但要新增表、清理逻辑与权限，属于另一个 change 的体量。
- **代价**：列表接口仍会回传 base64（已从数 MB 降到数百 KB）。缓解措施：压缩目标值设小；后续 change 再做列表不返回 `coverImage` 的裁剪。

### 2. 请求体上限：写进生效的 server 块

在 `/etc/nginx/nginx.conf` 承载 443 的 server 块内显式设置 `client_max_body_size 10m;`，`nginx -t` 通过后 `reload`；同时在 `DEPLOYMENT.md` 记录"`sites-available/csr` 不生效、以 `nginx -T` 为准"。

- **为什么**：10m 相对压缩后 ~400KB 的单图有 25 倍余量，同时避免放宽过度。
- **备选**：把 `sites-enabled/csr` 变成真正生效的配置并删掉 nginx.conf 里的重复 server 块。风险更大（涉及全站路由），不在本次范围。

### 3. 失败反馈：提高提示层级

页面级 toast 的层级提升到抽屉之上（`z-[60]`），并保持当前"`bottom-6 right-6`"定位。

- **为什么**：一行样式改动即可消除"被抽屉盖住"的根因，无需引入 Portal 与全局 toast 上下文。
- **备选**：Portal + 全局 toast provider。更整洁，但会牵动多个页面的提示调用点，本次不做。

### 4. 抽屉页脚：补齐 flex 收缩约束

给 `EventFormDrawer` / `ActivityViewDrawer` / `EventViewDrawer` 的抽屉容器加 `overflow-hidden`、滚动区与表单容器加 `min-h-0`，与 `ActivityFormDrawer` 完全一致。

- **为什么**：这是 flex 布局下 `min-height:auto` 导致子项不收缩的标准缺陷，三个组件与已修好的那个是同一份模板。

### 5. 封面呈现：顶部对齐裁切

卡片与详情页主图的 `<img>` 增加 `object-top`（即 `object-position: top`）。

- **为什么**：一行改动即可保住原图上部主体，且不改变容器尺寸与页面节奏。
- **备选**：容器改 `aspect-ratio` 自适应原图。更"还原"，但会让卡片高度随图片变化，破坏列表对齐；或在上传时按目标比例预先裁切，需产品确认裁切规则。

### 6. 事件读权限：拆分读写

移除 `EventController` 的类级 `@PreAuthorize`，对 `create` / `update` / `delete` 方法单独标注 `@PreAuthorize("hasRole('ADMIN')")`；`list` / `getById` 交由既有 `anyRequest().authenticated()` 规则覆盖。

- **为什么**：满足员工筛选所需，同时保留写操作的管理端专属，改动局限在一个文件。
- **备选**：在 `SecurityConfig` 里放行 `GET /api/v2/events`。会连带放开 `getById` 的语义边界，分散在两处不好维护，故不采用。

### 7. main 可构建性（已实施）

`UserActivityRepository` 补 `findByUserId`（JOIN FETCH activity）与 `findByIdWithActivity`（JOIN FETCH activity）。因 `open-in-view=false` 且关联为 `LAZY`，必须预取，否则修复编译后会在运行期抛 `LazyInitializationException`。

## Risks / Trade-offs

- **[压缩降低画质]** → 质量 0.82 + 长边 1600px 在手机与桌面缩略图场景下不可察觉；如需原图，后续接独立上传端点。
- **[列表接口仍带 base64]** → 单图降到数百 KB，20 条列表约数 MB；若继续变慢，下一 change 让列表不返回 `coverImage`。
- **[nginx reload 影响]** → 先 `nginx -t` 再 `reload`，旧 worker 平滑退出；本次只增一条指令，不改路由。
- **[放宽事件读权限导致信息可见面变大]** → 仅泄漏事件名称/描述/时间，员工本就要在活动详情看到所属事件；写操作仍为 ADMIN。
- **[object-top 在主体偏下的横图中可能裁掉中部]** → 影响小于当前"头部必被裁"；若后续出现具体图例再评估按比例自适应。
- **[线上仅前端旧包的历史遗留]** → 本次部署已校正到 HEAD；后续任何部署都必须以"线上资产哈希 == 本地构建哈希"作为验收点。

## Migration Plan

1. 后端修复（仓库编译）→ `mvn package -DskipTests` 通过。
2. nginx：改 `/etc/nginx/nginx.conf`（先备份）→ `nginx -t` → `systemctl reload nginx`。
3. 后端与前端一起部署（`deploy.ps1 -Frontend -Backend`），后端重启约 10–20s。
4. 回滚：前端 `/opt/csr/backup/frontend-<ts>/`、后端 `/opt/csr/backup/backend-<ts>.jar`、nginx 备份文件；均有 2026-10-17 的一份基线备份。

## Open Questions

- 上传体积上限最终取 10m 是否足够（若产品要求原图直传，需改为独立上传端点）。
- 封面是否应在上传时按 16:9 / 3:2 预先裁切——需要产品给出视觉取向后再定。
