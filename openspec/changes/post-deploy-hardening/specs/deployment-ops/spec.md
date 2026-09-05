## Purpose

定义一键部署脚本与生产运维的行为契约：部署失败必须显式暴露而非假成功；部署过程不得破坏服务器上的运行时数据；生产 nginx 配置有明确的纪律约束（`/admin` 路由唯一承接方、影子配置同步）；生产密钥文件不得进入版本库；运维手册必须存在并覆盖部署、巡检、排障、应急。

## ADDED Requirements

### Requirement: 部署失败必须显式报错

一键部署脚本（`deploy.ps1`）的每个关键步骤（构建、打包、上传、远端解压、依赖安装、服务重启、状态检查）SHALL 校验退出码/结果，任一步失败 SHALL 立即中止后续步骤并以非零退出码结束，不得输出误导性的「完成」信息。

#### Scenario: 上传失败时脚本中止

- **WHEN** 部署过程中任一上传步骤失败（如 scp 返回非零）
- **THEN** 脚本立即抛出明确错误并停止，不执行后续模块，退出码非 0，不输出「完成」

#### Scenario: AI 服务解压完整性校验

- **WHEN** AI 服务源码在服务器解压后缺少关键文件（如 `requirements.txt`、`main.py`）
- **THEN** 远端脚本返回失败，本地脚本报错中止，不重启服务

### Requirement: 部署不得破坏运行时数据

部署 AI 服务时 SHALL 保留服务器上的运行时文件（Python 虚拟环境、`.env`、`task_store.json`、`static/posters/`），且备份/恢复 SHALL 使用同一文件系统内的原子操作（同盘 mv），不得依赖跨文件系统复制。

#### Scenario: 部署后运行时数据完整

- **WHEN** 执行 AI 服务部署
- **THEN** 部署完成后 `.env`、`task_store.json`、`static/posters/` 下的历史海报与虚拟环境（含已安装依赖）均保持可用，服务重启后健康检查通过

#### Scenario: 源码解压失败不丢数据

- **WHEN** 源码解压步骤失败
- **THEN** 运行时文件备份仍可恢复，服务器上不存在「源码与运行时数据同时丢失」的状态

### Requirement: 打包排除非部署产物

部署打包 SHALL 排除本机环境产物与运行时数据：`.venv`、`__pycache__`、`*.pyc`、`.env`、`task_store.json`、`static/posters`、`tests`（AI 服务）；前端只上传构建产物 `dist`。

#### Scenario: AI 源码包不含本机虚拟环境

- **WHEN** 执行 AI 服务打包
- **THEN** 产物中不含 `.venv` 目录，体积为源码级别（KB 量级）

### Requirement: 生产 nginx 配置纪律

生产 nginx SHALL 由仓库内新 SPA 唯一承接 `/admin/**` 路由（仓库外旧版管理端不得再被任何 location 路由）；`proxy_pass` 不得剥离 `/api` 前缀（后端路由以 `/api/v2/**` 为准）；`sites-enabled/` 下的影子配置与生效配置 SHALL 保持行为一致，且备份文件不得放置于 `sites-enabled/` 目录（会被 include 加载）。

#### Scenario: 刷新管理端深链接

- **WHEN** 管理员在浏览器整页刷新或直接打开 `/admin/**` 任意深链接
- **THEN** 由新 SPA 接管并正常渲染，不出现旧版管理端登录页或被剥除 `/api` 前缀导致的接口 404

#### Scenario: nginx 影子配置不再构成隐患

- **WHEN** 检查生产 nginx 生效配置与 `sites-enabled` 影子配置
- **THEN** 两者的 `/api` 转发行为一致（均保留前缀），即使配置易主也不会断站

### Requirement: 生产密钥文件不入库

含生产密钥的环境变量文件（`env.sh`）SHALL 被版本库忽略，不得以任何方式提交。

#### Scenario: git add 全仓不捕获密钥

- **WHEN** 开发者执行 `git add .`
- **THEN** `env.sh` 不进入暂存区

### Requirement: 运维手册存在且可执行

项目根目录 SHALL 存在运维手册（`DEPLOYMENT.md`），覆盖部署流程与验证清单、服务器状态巡检、Bug 分层排查与常见问题速查、应急操作（重启/回滚/证书），且与实际生产环境（路径、服务名、nginx 结构、账号）一致。

#### Scenario: 依手册可完成一次部署与验证

- **WHEN** 运维人员按 `DEPLOYMENT.md` 的部署章节操作
- **THEN** 能完成一次全量部署并通过部署后验证清单确认服务健康
