# CSR Magic 后端 — 开发环境变量配置
# 执行方式：在 csr_magic_backend 目录下运行 PowerShell 并执行：
#   .\set-env.ps1
# 或手动在终端设置后再启动：
#   $env:JWT_SECRET = "你的密钥"
#   $env:DATABASE_PASSWORD = "你的数据库密码"

$env:JWT_SECRET = "K9TmR2Z2T_dgumeWKXfMUvRIS6NpXK8pQXepk-OKU-4="
$env:DATABASE_PASSWORD = "xiapeng123"

Write-Host "环境变量已设置：" -ForegroundColor Green
Write-Host "  JWT_SECRET        = $env:JWT_SECRET" -ForegroundColor Gray
Write-Host "  DATABASE_PASSWORD  = $env:DATABASE_PASSWORD" -ForegroundColor Gray
Write-Host ""
Write-Host "现在可以启动后端：mvn spring-boot:run" -ForegroundColor Cyan
