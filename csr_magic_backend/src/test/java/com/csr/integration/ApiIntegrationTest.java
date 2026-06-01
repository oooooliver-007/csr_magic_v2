package com.csr.integration;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 核心 API 集成测试 — 启动完整 Spring 上下文 + 真实数据库。
 * 不 mock 任何组件，验证 Controller → Service → Repository → DB 全链路。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("核心 API 集成测试")
class ApiIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private static String adminToken;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @Order(0)
    @DisplayName("健康检查返回 UP")
    void healthCheck() {
        ResponseEntity<Map> resp = restTemplate.getForEntity(url("/api/v2/health"), Map.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("status")).isEqualTo("UP");
    }

    @Test
    @Order(1)
    @DisplayName("登录成功获取 Token")
    void loginSuccess() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                "{\"username\":\"zhangsan\",\"password\":\"123456\"}", headers);

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                url("/api/v2/auth/login"), request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);

        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("accessToken")).asString().isNotEmpty();
        assertThat(data.get("refreshToken")).asString().isNotEmpty();

        Map<String, Object> user = (Map<String, Object>) data.get("user");
        assertThat(user.get("username")).isEqualTo("zhangsan");
        assertThat(user.get("role")).isEqualTo("ADMIN");

        adminToken = (String) data.get("accessToken");
    }

    @Test
    @Order(2)
    @DisplayName("无 Token 访问受保护端点返回 401")
    void unauthenticatedRequest() {
        ResponseEntity<Map> resp = restTemplate.getForEntity(url("/api/v2/users"), Map.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(resp.getBody().get("code")).isEqualTo(401);
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/v2/users 返回用户列表（回归：之前 CAST NULL 报 500）")
    void usersList() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/users?size=200"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);

        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("content")).isNotNull();

        // 不用 keyword 和 region，验证空参数场景
        ResponseEntity<Map> respNoFilter = restTemplate.exchange(
                url("/api/v2/users"), HttpMethod.GET, request, Map.class);

        assertThat(respNoFilter.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(respNoFilter.getBody().get("code")).isEqualTo(200);
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/v2/users 关键词搜索正常")
    void usersSearchByKeyword() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/users?keyword=zhang"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/v2/events 返回事件列表")
    void eventsList() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/events"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/v2/activities 返回活动列表")
    void activitiesList() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/activities"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);
    }

    @Test
    @Order(7)
    @DisplayName("GET /api/v2/dashboard/stats 管理端看板")
    void dashboardStats() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/dashboard/stats"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);

        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/v2/participations/review-todos 审核待办")
    void reviewTodos() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                url("/api/v2/participations/review-todos"), HttpMethod.GET, request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("code")).isEqualTo(200);
    }

    @Test
    @Order(9)
    @DisplayName("登录失败返回 401")
    void loginFailure() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                "{\"username\":\"zhangsan\",\"password\":\"wrong_password\"}", headers);

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                url("/api/v2/auth/login"), request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(resp.getBody().get("code")).isEqualTo(401);
    }

    @Test
    @Order(10)
    @DisplayName("注册重复用户名返回 409")
    void registerDuplicateUser() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                "{\"username\":\"zhangsan\",\"password\":\"test123456\",\"displayName\":\"测试\"}", headers);

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                url("/api/v2/auth/register"), request, Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resp.getBody().get("code")).isEqualTo(409);
    }
}