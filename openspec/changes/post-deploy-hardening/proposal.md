## Why

`fix-5-bugs` / `fix-remaining-bugs` 两个 change 的修复上线（2026-09-05）过程中，暴露出一批**部署链路与线上环境问题**：`deploy.ps1` 一键部署脚本存在假成功缺陷（无退出码检查、AI 模块上传失败仍报「完成」）、服务器 SSH 免密未配置、生产 nginx 存在双配置隐患（影子配置的 `proxy_pass` 尾斜杠会在将来 reload 时剥掉 `/api` 前缀导致全站 API 断裂）、`/admin` 路由被仓库外旧版管理端 SPA 劫持（即 `fix-remaining-bugs` 中明确「留待后续处理」的 BUG-10 运维侧遗留项）。同时，管理员会话从历史记录重开员工端页面（如 `/my`）会落在用户界面而非管理端，与登录落地规则不一致；管理端问卷管理/活动管理页面在手机端布局挤压溢出、按钮配色（蓝/黑）与品牌绿不统一。

## What Changes

- **deploy.ps1 一键部署脚本加固**：修复 `$ProjectRoot` 未定义导致 AI 模块部署必败；前端/AI 上传从「tar 管道直传 ssh」改为「tar 文件 + scp」（与后端上传同等可靠）；AI 打包排除 `.venv`（23MB→12KB）；每一步增加 `$LASTEXITCODE` 校验，失败立即 throw（杜绝假成功）；AI 运行时文件（venv/.env/task_store.json/海报）改用**同盘 mv** 备份过渡，杜绝 /tmp 跨文件系统风险。
- **生产 nginx 修复（BUG-10 运维侧收尾）**：移除 `nginx.conf` 中劫持 `/admin` 的仓库外旧版管理端 location（原文件备份于服务器 `/root/nginx.conf.bak-20260905`）；修正 `sites-enabled/csr` 影子配置的 `proxy_pass http://127.0.0.1:8080/;` 尾斜杠（避免将来 reload 时剥掉 `/api` 前缀）。
- **管理端手机端 UI 修复**：问卷管理页头部改为手机端上下堆叠 + 按钮组换行；活动管理页工具栏改为「搜索整行 → 两个筛选等分一行 → 新建按钮整行」的对齐网格。两页均以 390px 视口无横向溢出、控件边缘对齐（坐标差 < 2px）为验收标准。
- **管理端按钮配色统一**：问卷管理页 6 个蓝/黑按钮（AI 生成问卷、手动创建问卷、AI 生成题目、3 个保存）全部改为与活动管理「新建活动」一致的品牌绿 `#2EB87A`。
- **管理员落地规则统一**：管理员会话访问任意员工端页面（`/`、`/activities`、`/my`、`/poster`、`/notifications`、`/surveys/**`）一律重定向到 `/admin`，与登录后落地规则一致（`EmployeeLayout` 布局层守卫）；员工会话不受影响。
- **运维文档与密钥防泄漏**：新增根目录 `DEPLOYMENT.md`（部署流程、状态巡检、Bug 排查、应急操作手册）；`.gitignore` 增加 `env.sh`（生产密钥文件，禁止入库）。

## Capabilities

> 项目尚无 `openspec/specs` 主规格（既有 change 的 delta 尚未归档同步），沿用平铺布局以新能力引入。其中 `admin-session` 与 `fix-remaining-bugs` 中的同名能力在归档后自然合并，本次 delta 只新增其遗留的运维侧与管理员落地规则场景。

### New Capabilities

- `deployment-ops`: 一键部署脚本行为契约（失败显式报错、运行时数据保留、打包排除项）、生产 nginx 配置纪律（`/admin` 路由唯一承接方、影子配置同步）、密钥文件不入库、运维手册存在性。
- `admin-console-ui`: 管理端控制台 UI 规范（手机端无横向溢出、控件对齐网格、操作按钮品牌色统一）。
- `admin-session`: 管理员落地规则（管理员会话访问任意员工端页面一律重定向管理端）与管理端路由唯一承接方（延续 `fix-remaining-bugs` 同名能力，补其遗留的运维侧场景）。

### Modified Capabilities

（无——主规格目录尚未建立，暂不声明修改）

## Impact

- **前端**：`SurveyManagementPage`（头部响应式 + 6 处按钮配色）、`ActivityManagementPage`（工具栏响应式）、`EmployeeLayout`（管理员守卫）、`HomePage`（曾加临时守卫后随统一规则移除）。
- **部署工具**：`deploy.ps1`（重写上传/校验/备份逻辑）。
- **服务器运维**：阿里云 ECS `8.133.240.77` 的 nginx 配置（两处）、`/opt/csr` 部署物、SSH 免密公钥（`authorized_keys`）。
- **文档/配置**：新增 `DEPLOYMENT.md`；`.gitignore` 增加一行。
- **测试**：新增线上 Playwright 回归（黑盒 13 缺陷回归、手机端 UI 对齐断言、登出/重开落地规则），全部在 joy4giving.cn 实测通过；前端 `npm run build` 通过。
- **无 API 变更**；无数据库迁移；无依赖变更。

## 回溯性说明

本 change 为**回溯性记录**：上述改动已于 2026-09-05 实施完成并部署上线，tasks.md 中的任务按实际完成状态勾选，验证方式以线上 Playwright 实测与构建输出为准。
