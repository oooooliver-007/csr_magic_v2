## Purpose

约束线上部署物与版本库的一致性，以及反向代理层与业务功能相匹配的上传体积上限，使"从 `main` 构建即可部署"成为可验证的前提。

## ADDED Requirements

### Requirement: 后端必须可由 main 构建

版本库 `main` 分支的 `csr_magic_backend` SHALL 能在无本地未提交改动的前提下通过 `mvn package -DskipTests` 完成编译，任何引用了不存在方法/类型的合并结果 MUST 视为 `main` 不可发布状态并优先修复。

#### Scenario: 从干净检出构建后端

- **WHEN** 在只检出 `main` 的工作区执行 `mvn package -DskipTests`
- **THEN** 构建成功并产出可部署的 jar，无 `COMPILATION ERROR`

#### Scenario: 线上后端版本与 main 对齐

- **WHEN** 完成一次全量部署后检查线上 `/opt/csr/backend/*.jar`
- **THEN** 该 jar 的构建时间晚于本次部署开始时间，且后端日志出现本次启动的 `Started CsrMagicApplication`

### Requirement: 反代请求体上限必须写在生效配置中

承载 `joy4giving.cn` 的 **nginx 生效配置**（以 `nginx -T` 输出为准）SHALL 显式声明 `client_max_body_size`，其值 MUST 大于业务允许上传的最大文件经编码膨胀后的体积；仅写在未被 include 的文件（如 `sites-available/` 下的非链接副本）中不视为满足。

#### Scenario: 校验生效配置

- **WHEN** 在服务器执行 `nginx -T | grep client_max_body_size`
- **THEN** 输出中存在该指令且值不小于业务上限，而不是落到 nginx 默认的 1MB

#### Scenario: 超默认大小但低于上限的请求不被拦截

- **WHEN** 客户端向任意受保护的 API 端点提交体积大于 1MB、小于配置上限的请求体
- **THEN** 请求到达应用层（返回业务状态码或鉴权失败），而不是 nginx 的 `413 Request Entity Too Large`

### Requirement: 部署后必须可验证真实生效

每次前端部署后 SHALL 以线上可观测证据确认新构建已生效，至少包含：`index.html` 引用的资产哈希与本次构建产物一致、相关服务 `systemctl is-active` 为 `active`、经 nginx 的接口探测返回预期状态码。

#### Scenario: 前端部署生效确认

- **WHEN** 部署完成后请求 `https://joy4giving.cn/` 并读取其 `script[src]`
- **THEN** 资产文件名与本次本地构建产物的文件名一致
