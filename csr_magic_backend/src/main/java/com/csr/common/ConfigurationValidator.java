package com.csr.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时校验关键配置项，防止使用默认或空值上线。
 * 校验失败直接终止启动，给出明确的修复指引。
 *
 * dbPassword 从 Spring 管理的 spring.datasource.password 读取，
 * 这样 dev profile 中 application-dev.yml 的值可以生效。
 */
@Component
public class ConfigurationValidator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ConfigurationValidator.class);

    private static final String PLACEHOLDER_PREFIX = "your-256-bit";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Override
    public void run(String... args) {
        // 1. 校验 JWT 密钥
        if (jwtSecret == null || jwtSecret.isBlank()) {
            log.error("======================================================");
            log.error("  [配置错误] JWT_SECRET 未设置");
            log.error("  请在环境变量中设置 JWT_SECRET 为至少 256 位的密钥。");
            log.error("======================================================");
            throw new IllegalStateException("JWT_SECRET 未设置，必须在环境变量中配置安全密钥后启动");
        }

        if (jwtSecret.toLowerCase().startsWith(PLACEHOLDER_PREFIX)) {
            log.error("======================================================");
            log.error("  [配置错误] JWT_SECRET 仍为占位符值，请替换为实际密钥");
            log.error("======================================================");
            throw new IllegalStateException("JWT_SECRET 使用了占位符值，必须替换为实际安全密钥");
        }

        // 2. 校验数据库密码
        if (dbPassword == null || dbPassword.isBlank()) {
            log.error("======================================================");
            log.error("  [配置错误] spring.datasource.password 未设置");
            log.error("  生产环境请在环境变量中设置 DATABASE_PASSWORD。");
            log.error("  本地开发请运行 set-env.bat 激活 dev profile。");
            log.error("======================================================");
            throw new IllegalStateException("数据库密码未设置，生产环境需配置 DATABASE_PASSWORD 环境变量");
        }

        log.info("配置校验通过：JWT_SECRET 已设置（长度={}），数据库密码已设置", jwtSecret.length());
    }
}