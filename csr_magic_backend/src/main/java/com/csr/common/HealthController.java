package com.csr.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

/**
 * 健康检查端点，供负载均衡 / 编排系统探活使用。
 * 基础路径 /api/v2/health 在 SecurityConfig 中设为 permitAll。
 */
@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/v2/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbOk = checkDatabase();
        int httpStatus = dbOk ? 200 : 503;

        Map<String, Object> body = Map.of(
                "status", dbOk ? "UP" : "DOWN",
                "database", dbOk ? "connected" : "unreachable"
        );

        return ResponseEntity.status(httpStatus).body(body);
    }

    private boolean checkDatabase() {
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(3);
        } catch (Exception e) {
            return false;
        }
    }
}
