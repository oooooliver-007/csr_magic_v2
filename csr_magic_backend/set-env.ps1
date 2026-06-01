# ============================================================
# CSR Magic 后端 — 本地开发环境一键配置（PowerShell 版本）
#
# 激活 dev profile，Spring Boot 自动加载 application-dev.yml
# 其中的数据库密码和 JWT 密钥仅用于本地开发。
#
# 运行方式：在 csr_magic_backend 目录下运行：
#   .\set-env.ps1
# 然后启动：mvn spring-boot:run
# ============================================================

$env:SPRING_PROFILES_ACTIVE = "dev"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   开发环境已就绪（spring.profiles.active=dev）" -ForegroundColor Green
Write-Host "   数据库: localhost:5432/CSR_DB" -ForegroundColor Gray
Write-Host "   Swagger: http://localhost:8080/swagger-ui" -ForegroundColor Gray
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "启动后端：mvn spring-boot:run" -ForegroundColor Cyan
Write-Host ""