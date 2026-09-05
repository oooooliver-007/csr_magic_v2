> **回溯性记录**：本 change 于 2026-09-05 实施并上线，以下任务按实际完成状态勾选，验证均为已执行的命令/实测结果。

## 1. 部署脚本加固（deploy.ps1）

- [x] 1.1 修复 `$ProjectRoot` 未定义（`$PSScriptRoot`），AI 模块打包目录恢复正确 —— 验证：`.\deploy.ps1 -Ai` 全流程通过，服务 active
- [x] 1.2 前端/AI 上传改为「tar 文件 + scp」+ 远端解压，替换 tar 管道直传；AI 打包排除 `.venv`（23MB→12KB） —— 验证：`deploy.ps1 -Frontend` 后线上资产哈希与本地构建一致；`deploy.ps1 -Ai` 重跑通过
- [x] 1.3 每步增加 `$LASTEXITCODE` 校验（构建/打包/scp/远端解压/依赖安装/重启），失败 throw 中止；前端构建产物存在性校验 —— 验证：构造失败场景（限流、路径错误）均报错中止，不再假成功
- [x] 1.4 AI 运行时文件改同盘 mv 备份（venv→`/opt/csr/venv-keep`），`.env`/`task_store.json`/海报 cp 过渡 + 远端 `set -e` + 解压后 `test -f` 完整性校验 —— 验证：`deploy.ps1 -Ai` 后 `.env`/task_store.json/海报/venv 全部完好，`/health` 返回 ok
- [x] 1.5 手工恢复事故现场：重建 venv 并 `pip install`、恢复源码与运行时数据、清理 `/tmp` 备份 —— 验证：`csr-ai` active，`curl 127.0.0.1:8000/health` 正常

## 2. 生产 nginx 修复（BUG-10 运维侧收尾）

- [x] 2.1 配置本机 SSH 免密（公钥写入服务器 `authorized_keys`），deploy.ps1 运行前提打通 —— 验证：`ssh -o BatchMode=yes` 免密连通
- [x] 2.2 移除 `nginx.conf` 中劫持 `/admin` 的旧版管理端 location（备份 `/root/nginx.conf.bak-20260905`），`nginx -t` + reload —— 验证：`nginx -T` 无 admin location；`/admin`、`/admin/users` 返回新 SPA（title CSR Magic）
- [x] 2.3 修正 `sites-enabled/csr` 影子配置 `proxy_pass http://127.0.0.1:8080/;` 尾斜杠（剥 `/api` 前缀隐患）并 reload —— 验证：经 nginx 登录探测返回 400（前缀保留），首页 200
- [x] 2.4 事故档案化：tar 管道静默失败、Spring Security 401 掩盖 404、GET 打 POST 接口得 500、nginx reload 新旧 worker 过渡窗写入 `DEPLOYMENT.md` 排查章节

## 3. 管理端手机端 UI 修复

- [x] 3.1 `SurveyManagementPage` 头部改为 `flex-col sm:flex-row` 堆叠 + 按钮组 `flex-wrap`；「共 N 份问卷」移动端独占一行 —— 验证：390×844 视口无横向溢出，按钮换行有序
- [x] 3.2 `SurveyManagementPage` 6 个蓝/黑按钮统一品牌绿 `#2EB87A`（AI 生成问卷/手动创建问卷/AI 生成题目/3 个保存） —— 验证：grep 无 `bg-blue-600`/`bg-gray-800` 残留；线上 `getComputedStyle` 为 `rgb(46,184,122)`
- [x] 3.3 `ActivityManagementPage` 工具栏移动端对齐网格：搜索整行（`w-full sm:w-64`）、两个下拉等分一行（`flex-1 min-w-0 sm:flex-none`）、新建按钮整行（`w-full sm:w-auto justify-center`） —— 验证：Playwright boundingBox 边缘坐标差 < 2px 断言通过
- [x] 3.4 固化移动端 UI 回归用例 `e2e/prod/mobile-ui-check.spec.ts`（6 个管理页溢出检查 + 对齐断言 + 按钮颜色断言 + 截图） —— 验证：`npx playwright test -c playwright.prod.config.ts mobile-ui-check` 全绿，截图存 `test-results/mobile_admin_*.png`

## 4. 管理员落地规则统一

- [x] 4.1 `EmployeeLayout` 增加管理员守卫：`user.role === 'ADMIN'` 访问任意员工端页面重定向 `/admin`；移除 `HomePage` 临时守卫 —— 验证：`npm run build` 通过（无未用导入）
- [x] 4.2 线上回归 `e2e/prod/logout-revive.spec.ts`：管理员不登出关页 → 历史重开 `/`、`/my`、`/activities` 均落管理端；员工会话不受影响；登出后重开各路径落登录页且 localStorage/Cookie 无残留 —— 验证：3 用例全绿（21.4s）

## 5. 运维文档与密钥防泄漏

- [x] 5.1 新增根目录 `DEPLOYMENT.md`（架构、服务器速查、部署流程与验证清单、状态巡检、Bug 排查速查表、应急操作、安全注意事项） —— 验证：内容与线上实测环境一致（路径/服务名/nginx 结构均经 ssh 核实）
- [x] 5.2 `.gitignore` 增加 `env.sh`（生产密钥文件） —— 验证：`git status` 确认 env.sh 不再出现在未跟踪列表之外的风险位（原为 `??` 未忽略状态）
- [x] 5.3 黑盒报告 13 缺陷线上回归（Playwright 黑盒回归套件 10 用例）—— 验证：BUG-01~13 全部验证通过或按设计意图关闭（BUG-08 展示侧修复、BUG-11 静默修复+规则保留），遗留观察项（管理员弱口令）已再次提示

## 6. 收尾

- [x] 6.1 `openspec validate --changes post-deploy-hardening` 通过
- [x] 6.2 归档说明：本 change 与 `fix-5-bugs`/`fix-remaining-bugs` 的 delta 待主规格归档时合并；`admin-session` 能力在两侧的场景互补不冲突
