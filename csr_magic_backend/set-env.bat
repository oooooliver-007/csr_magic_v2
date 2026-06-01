@echo off
REM ============================================================
REM CSR Magic 后端 — 本地开发环境一键配置（CMD 版本）
REM
REM 激活 dev profile，Spring Boot 自动加载 application-dev.yml
REM 其中的数据库密码和 JWT 密钥仅用于本地开发。
REM
REM 运行方式：在 csr_magic_backend 目录下运行 set-env.bat
REM 然后启动：mvn spring-boot:run
REM ============================================================

set SPRING_PROFILES_ACTIVE=dev

echo.
echo  ============================================
echo   开发环境已就绪（spring.profiles.active=dev）
echo   数据库: localhost:5432/CSR_DB
echo   Swagger: http://localhost:8080/swagger-ui
echo  ============================================
echo.
echo 启动后端：mvn spring-boot:run
echo.