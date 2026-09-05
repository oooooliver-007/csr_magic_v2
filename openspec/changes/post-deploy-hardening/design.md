## Context

`fix-5-bugs` / `fix-remaining-bugs` 上线过程中发现三类问题：部署工具缺陷（脚本假成功、管道上传静默失败）、生产 nginx 配置隐患（影子配置 + `/admin` 被仓库外旧版 SPA 劫持，即 `fix-remaining-bugs` 任务 9.4 明确「留待后续处理」的运维侧）、管理端手机端 UI 与管理员落地规则不一致。生产环境为单台阿里云 ECS（Ubuntu，1.6G 内存），nginx 存在「`nginx.conf` 本体 server 块（生效）+ `sites-enabled/csr`（被遮蔽的影子）」双配置结构，短期无法收敛为单配置。

## Goals / Non-Goals

**Goals**

- 部署脚本失败可观测：任一步骤失败即停、报错明确，杜绝假成功。
- 部署过程不损坏服务器运行时数据（venv/.env/任务状态/海报）。
- 拆除 nginx 两处断站隐患；`/admin` 由新 SPA 唯一承接（BUG-10 运维侧收尾）。
- 管理端手机端可用性：390px 视口无横向溢出、控件对齐可程序化验收。
- 管理员落地规则与登录行为一致；密钥文件防泄漏；运维知识沉淀为手册。

**Non-Goals**

- 不收敛 nginx 双配置结构为单配置（涉及 Certbot 自动化与历史约定，风险大于收益，仅在手册中记录同步纪律）。
- 不改动后端代码与数据库结构。
- 不处理黑盒报告中的观察项（弱口令、限流策略调整等）。

## Decisions

1. **deploy.ps1 上传通道统一为「tar 文件 + scp」**（放弃 tar 管道直传 ssh）。
   - 依据：本次事故中 tar 管道对 AI 模块静默失败（本机 23MB 包未送达、远端 `rm -rf` 后解压为空），而后端 scp 上传一直可靠；管道方案还受 PowerShell 原生管道字节语义与 ssh 多行参数影响，故障难定位。
   - 替代方案：保留管道并加校验—— rejected，管道失败模式不可观测，且无法做解压后完整性校验。
2. **AI 运行时文件备份用「同盘 mv」而非「备份到 /tmp 再 mv 回」**：`/tmp` 可能为 tmpfs，跨文件系统 mv 退化为复制，正是本次 venv 变空壳的帮凶；同盘 rename 原子可靠。`.env`/`task_store.json` 等小文件用 cp + 校验。
3. **每步退出码检查 + 远端 `set -e` + 解压后 `test -f` 关键文件**：本次「上传失败仍报完成」的根因是脚本无任何 `$LASTEXITCODE` 校验；解压完整性用 `test -f requirements.txt` 兜底。
4. **nginx 采用最小干预修复**：只移除劫持 `/admin` 的 location（旧应用文件保留于 `/opt/csr-admin` 不删，可回滚）、只改影子配置尾斜杠，不动生效配置的其余结构；备份置于 `/root`（不可放 `sites-enabled/`，会被 include 加载）。reload 后用「直连后端 vs 经 nginx」双探针 + `nginx -T` 验证。
5. **管理员落地规则放在 `EmployeeLayout`（布局层）而非逐页**：一次覆盖全部员工端路由，与 `AdminLayout` 的角色门禁对称；曾先加在 `HomePage` 后撤除，避免双处逻辑漂移。管理员访问 `/activities` 等用户页的场景（查看用户视角）按用户要求一并收进管理端。
6. **手机端 UI 用「响应式类 + 程序化坐标断言」验收**：布局用 `flex-col sm:flex-row` / `flex-wrap` / `w-full sm:w-64` / `flex-1` 表达；验收不靠目测，Playwright 以 390×844 视口断言 `scrollWidth ≤ clientWidth` 与控件 boundingBox 边缘差 < 2px，固化进 `e2e/prod/mobile-ui-check.spec.ts` 可随时复跑。
7. **按钮配色只统一「按钮」，不动信息性配色**：题目类型徽章、选项分布进度条、聚焦光圈保留蓝色语义，避免「全部换绿」掩盖信息层级。
8. **运维知识沉淀为 `DEPLOYMENT.md`**：含本次事故的教训（nginx 双配置、探针 401 掩盖 404、GET 打 POST 接口得 500 等排查技巧）；`.gitignore` 补 `env.sh`（生产密钥，实测未被 git 跟踪但未被忽略，一次 `git add .` 即泄漏）。

## Risks / Trade-offs

- **[nginx 双配置长期并存]** 影子配置已对齐行为，但两处需人工同步 → 已写入 `DEPLOYMENT.md` 纪律与速查表；后续可评估彻底合并。
- **[管理员无法再浏览员工端页面]** 落地规则收紧后管理员查看用户视角需临时调整 → 按用户明确要求执行；如需恢复可在 `EmployeeLayout` 加白名单路由。
- **[生产为单机 1.6G 内存]** 部署重启存在 OOM 敏感窗口 → 手册巡检章节给出阈值与缓解措施，长期建议升配。
- **[测试账号遗留]** 线上回归产生 8 个 `pw_*` 测试账号与 4 条报名记录 → 已在交付说明中列明，可由管理员后台清理。
