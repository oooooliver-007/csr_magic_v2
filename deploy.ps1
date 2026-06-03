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
    Push-Location csr_magic_frontend
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "构建失败" }
    } finally { Pop-Location }

    Write-Host "[2/3] 上传前端 (tar 打包直传)..." -ForegroundColor Cyan
    Push-Location csr_magic_frontend
    try {
        tar czf - dist | ssh $Server "cd $FrontendRemote && rm -rf dist && tar xzf -"
    } finally { Pop-Location }

    Write-Host "前端部署完成 (nginx 自动生效, 无需重启)" -ForegroundColor Green
}

function Deploy-Backend {
    Write-Host "`n[1/3] 构建后端 (跳过测试)..." -ForegroundColor Cyan
    Push-Location csr_magic_backend
    try {
        mvn package -DskipTests -q
        if ($LASTEXITCODE -ne 0) { throw "构建失败" }
    } finally { Pop-Location }

    Write-Host "[2/3] 上传 JAR + 重启服务..." -ForegroundColor Cyan
    scp $BackendJar "${Server}:${BackendRemote}/"
    ssh $Server "chown csr:csr $BackendRemote/*.jar && systemctl restart $BackendSvc"

    Write-Host "[3/3] 等待服务就绪..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    $status = ssh $Server "systemctl is-active $BackendSvc"
    Write-Host "后端状态: $status" -ForegroundColor $(if ($status -eq "active") { "Green" } else { "Red" })
}

function Deploy-Ai {
    Write-Host "`n[1/3] 上传 AI 服务源码 (tar 打包直传)..." -ForegroundColor Cyan
    Push-Location $ProjectRoot
    try {
        tar czf - `
            --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' `
            --exclude='task_store.json' --exclude='static/posters' --exclude='tests' `
            csr_ai_service `
        | ssh $Server @"
            # 备份要保留的运行时文件
            cp -r $AiRemote/venv /tmp/ai-venv 2>/dev/null
            cp $AiRemote/.env /tmp/ai-env.bak 2>/dev/null
            cp $AiRemote/task_store.json /tmp/ai-task.bak 2>/dev/null
            cp -r $AiRemote/static/posters /tmp/ai-posters 2>/dev/null
            # 清空并解压
            rm -rf $AiRemote && mkdir -p $AiRemote
            tar xzf - --strip-components=1 -C $AiRemote
            # 恢复保留项
            mv /tmp/ai-venv $AiRemote/venv 2>/dev/null
            mv /tmp/ai-env.bak $AiRemote/.env 2>/dev/null
            mv /tmp/ai-task.bak $AiRemote/task_store.json 2>/dev/null
            mkdir -p $AiRemote/static/posters
            mv /tmp/ai-posters/* $AiRemote/static/posters/ 2>/dev/null
            rm -rf /tmp/ai-posters
            # 修正权限（root 上传的文件要改回 csr 用户）
            chown -R csr:csr $AiRemote
"@
    } finally { Pop-Location }

    Write-Host "[2/4] 安装 Python 依赖..." -ForegroundColor Cyan
    ssh $Server "test -d $AiRemote/venv || python3 -m venv $AiRemote/venv; $AiRemote/venv/bin/pip install -r $AiRemote/requirements.txt -q"

    Write-Host "[3/4] 重启 AI 服务..." -ForegroundColor Cyan
    ssh $Server "systemctl restart $AiSvc"

    Write-Host "[4/4] 等待服务就绪..." -ForegroundColor Cyan
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
