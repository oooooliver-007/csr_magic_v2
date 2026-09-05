# ============================================================
# CSR Magic 一键部署脚本 (PowerShell)
# 用法:
#   .\deploy.ps1                    # 交互式选择部署模块
#   .\deploy.ps1 -Frontend           # 只部署前端
#   .\deploy.ps1 -Backend            # 只部署后端
#   .\deploy.ps1 -Ai                 # 只部署 AI 服务
#   .\deploy.ps1 -All                # 部署全部
# ============================================================

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Ai,
    [switch]$All
)

# ---------- 配置 ----------
$ProjectRoot = $PSScriptRoot
$Server   = "root@8.133.240.77"
$FrontendDist = "csr_magic_frontend/dist"
$FrontendRemote = "/opt/csr/frontend"
$BackendJar  = "csr_magic_backend/target/csr-magic-backend-0.0.1-SNAPSHOT.jar"
$BackendRemote = "/opt/csr/backend"
$AiSource    = "csr_ai_service"
$AiRemote    = "/opt/csr/ai-service"
$BackendSvc  = "csr-backend"
$AiSvc       = "csr-ai"

# ---------- 函数 ----------
function Deploy-Frontend {
    Write-Host "`n[1/3] 构建前端..." -ForegroundColor Cyan
    Push-Location (Join-Path $ProjectRoot "csr_magic_frontend")
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }
    } finally { Pop-Location }

    Write-Host "[2/3] 打包并上传前端 (tar -> scp)..." -ForegroundColor Cyan
    $tgz = Join-Path $env:TEMP "csr-dist.tgz"
    tar czf $tgz -C (Join-Path $ProjectRoot "csr_magic_frontend") dist
    if ($LASTEXITCODE -ne 0) { throw "前端打包失败" }
    scp $tgz "${Server}:/tmp/csr-dist.tgz"
    if ($LASTEXITCODE -ne 0) { throw "前端上传失败" }
    ssh $Server "cd $FrontendRemote && rm -rf dist && tar xzf /tmp/csr-dist.tgz && rm -f /tmp/csr-dist.tgz"
    if ($LASTEXITCODE -ne 0) { throw "前端远端解压失败" }

    Write-Host "[3/3] 前端部署完成 (nginx 自动生效, 无需重启)" -ForegroundColor Green
}

function Deploy-Backend {
    Write-Host "`n[1/3] 构建后端 (跳过测试)..." -ForegroundColor Cyan
    Push-Location (Join-Path $ProjectRoot "csr_magic_backend")
    try {
        mvn package -DskipTests -q
        if ($LASTEXITCODE -ne 0) { throw "后端构建失败" }
    } finally { Pop-Location }

    Write-Host "[2/3] 上传 JAR + 重启服务..." -ForegroundColor Cyan
    $jarPath = Join-Path $ProjectRoot $BackendJar
    if (-not (Test-Path $jarPath)) { throw "未找到构建产物: $jarPath" }
    scp $jarPath "${Server}:${BackendRemote}/"
    if ($LASTEXITCODE -ne 0) { throw "后端 JAR 上传失败" }
    ssh $Server "chown csr:csr $BackendRemote/*.jar && systemctl restart $BackendSvc"
    if ($LASTEXITCODE -ne 0) { throw "后端重启失败" }

    Write-Host "[3/3] 等待服务就绪..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    $status = ssh $Server "systemctl is-active $BackendSvc"
    Write-Host "后端状态: $status" -ForegroundColor $(if ($status -eq "active") { "Green" } else { "Red" })
}

function Deploy-Ai {
    Write-Host "`n[1/5] 打包 AI 服务源码 (tar)..." -ForegroundColor Cyan
    $tgz = Join-Path $env:TEMP "csr-ai.tgz"
    tar czf $tgz `
        --exclude=.venv --exclude=__pycache__ --exclude=*.pyc --exclude=.env `
        --exclude=task_store.json --exclude=static/posters --exclude=tests `
        -C $ProjectRoot csr_ai_service
    if ($LASTEXITCODE -ne 0) { throw "AI 服务打包失败" }

    Write-Host "[2/5] 上传 AI 服务源码 (scp)..." -ForegroundColor Cyan
    scp $tgz "${Server}:/tmp/csr-ai.tgz"
    if ($LASTEXITCODE -ne 0) { throw "AI 服务上传失败" }

    Write-Host "[3/5] 远端解压 + 保留运行时文件 (venv/.env/任务状态/海报)..." -ForegroundColor Cyan
    # venv 用同盘 mv 备份 (rename 原子可靠, 避免 /tmp 跨文件系统问题)
    ssh $Server @"
        set -e
        rm -rf /opt/csr/venv-keep
        mv $AiRemote/venv /opt/csr/venv-keep 2>/dev/null || true
        cp $AiRemote/.env /opt/csr/.env-keep 2>/dev/null || true
        cp $AiRemote/task_store.json /opt/csr/task-keep.json 2>/dev/null || true
        rm -rf /opt/csr/posters-keep
        mkdir -p /opt/csr/posters-keep
        cp -r $AiRemote/static/posters/. /opt/csr/posters-keep/ 2>/dev/null || true
        rm -rf $AiRemote && mkdir -p $AiRemote
        tar xzf /tmp/csr-ai.tgz --strip-components=1 -C $AiRemote && rm -f /tmp/csr-ai.tgz
        mv /opt/csr/venv-keep $AiRemote/venv 2>/dev/null || true
        cp /opt/csr/.env-keep $AiRemote/.env 2>/dev/null || true
        cp /opt/csr/task-keep.json $AiRemote/task_store.json 2>/dev/null || true
        mkdir -p $AiRemote/static/posters
        cp -r /opt/csr/posters-keep/. $AiRemote/static/posters/ 2>/dev/null || true
        rm -rf /opt/csr/posters-keep /opt/csr/.env-keep /opt/csr/task-keep.json
        # 修正权限（root 上传的文件要改回 csr 用户）
        chown -R csr:csr $AiRemote
        # 解压完整性校验
        test -f $AiRemote/requirements.txt || { echo "解压后缺少 requirements.txt" >&2; exit 1; }
        test -f $AiRemote/main.py        || { echo "解压后缺少 main.py" >&2; exit 1; }
"@
    if ($LASTEXITCODE -ne 0) { throw "AI 服务远端解压/恢复失败" }

    Write-Host "[4/5] 安装 Python 依赖..." -ForegroundColor Cyan
    ssh $Server "test -d $AiRemote/venv || python3 -m venv $AiRemote/venv; $AiRemote/venv/bin/pip install -r $AiRemote/requirements.txt -q"
    if ($LASTEXITCODE -ne 0) { throw "AI 服务依赖安装失败" }

    Write-Host "[5/5] 重启 AI 服务..." -ForegroundColor Cyan
    ssh $Server "systemctl restart $AiSvc"
    if ($LASTEXITCODE -ne 0) { throw "AI 服务重启失败" }
    Start-Sleep -Seconds 3
    $status = ssh $Server "systemctl is-active $AiSvc"
    Write-Host "AI 服务状态: $status" -ForegroundColor $(if ($status -eq "active") { "Green" } else { "Red" })
}

# ---------- 主流程 ----------
if ($All) {
    Deploy-Frontend
    Deploy-Backend
    Deploy-Ai
} elseif ($Frontend -or $Backend -or $Ai) {
    if ($Frontend) { Deploy-Frontend }
    if ($Backend)  { Deploy-Backend }
    if ($Ai)       { Deploy-Ai }
} else {
    Write-Host "`n选择部署模块:" -ForegroundColor Yellow
    Write-Host "  1 - 仅前端 (静态文件, 构建+上传)"
    Write-Host "  2 - 仅后端 (编译+上传+重启)"
    Write-Host "  3 - 仅 AI 服务 (上传+重启)"
    Write-Host "  4 - 全部部署"
    Write-Host "  q - 退出"
    $choice = Read-Host "`n输入编号"

    switch ($choice) {
        "1" { Deploy-Frontend }
        "2" { Deploy-Backend }
        "3" { Deploy-Ai }
        "4" { Deploy-Frontend; Deploy-Backend; Deploy-Ai }
        "q" { Write-Host "已取消" }
        default { Write-Host "无效选择" -ForegroundColor Red }
    }
}

Write-Host "`n完成." -ForegroundColor Green
