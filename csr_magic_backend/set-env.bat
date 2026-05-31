@echo off
REM CSR Magic 后端 — 开发环境变量配置（CMD 版本）
REM 在 csr_magic_backend 目录下运行：set-env.bat

set JWT_SECRET=K9TmR2Z2T_dgumeWKXfMUvRIS6NpXK8pQXepk-OKU-4=
set DATABASE_PASSWORD=xiapeng123

echo 环境变量已设置：
echo   JWT_SECRET       = %JWT_SECRET%
echo   DATABASE_PASSWORD = %DATABASE_PASSWORD%
echo.
echo 现在可以启动后端：mvn spring-boot:run
