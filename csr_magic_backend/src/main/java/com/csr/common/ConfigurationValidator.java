package com.csr.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时校验关键配置项，防止使用默认或空值上线。
 * 校验失败直接终止启动，给出明确的修复指引。
 */
@Component
public class ConfigurationValidator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ConfigurationValidator.class);

    private static final String PLACEHOLDER_PREFIX = "your-256-bit";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${DATABASE_PASSWORD:}")
    private String dbPassword;

    @Override
    public void run(String... args) {
        // 1. 校验 JWT 密钥
        if (jwtSecret == null || jwtSecret.isBlank()) {
            log.error("======================================================");
            log.error("  [配置错误] JWT_SECRET 未设置");
            log.error("  请在环境变量中设置 JWT_SECRET 为至少 256 位的密钥。");
            log.error("  示例（Linux/macOS）：export JWT_SECRET=$(openssl rand -base64 32)");
            log.error("  示例（Windows PowerShell）：");
            log.error("    $env:JWT_SECRET = [Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)}))");
            log.error("======================================================");
            throw new IllegalStateException("JWT_SECRET 未设置，必须在环境变量中配置安全密钥后启动");
        }

        if (jwtSecret.toLowerCase().startsWith(PLACEHOLDER_PREFIX)) {
            log.error("======================================================");
            log.error("  [配置错误] JWT_SECRET 仍为占位符值，请替换为实际密钥");
            log.error("  当前值以 '{}' 开头，这是一个示例占位符。", PLACEHOLDER_PREFIX);
            log.error("  请生成一个随机密钥并设置到环境变量 JWT_SECRET。");
            log.error("======================================================");
            throw new IllegalStateException("JWT_SECRET 使用了占位符值，必须替换为实际安全密钥");
        }

        // 2. 校验数据库密码
        if (dbPassword == null || dbPassword.isBlank()) {
            log.error("======================================================");
            log.error("  [配置错误] DATABASE_PASSWORD 未设置");
            log.error("  请在环境变量中设置 DATABASE_PASSWORD 为数据库连接密码。");
            log.error("  示例：export DATABASE_PASSWORD=your_actual_password");
            log.error("======================================================");
            throw new IllegalStateException("DATABASE_PASSWORD 未设置，必须在环境变量中配置数据库密码后启动");
        }

        log.info("配置校验通过：JWT_SECRET 已设置（长度={}），DATABASE_PASSWORD 已设置", jwtSecret.length());
    }
}
