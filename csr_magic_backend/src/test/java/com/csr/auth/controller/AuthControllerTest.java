package com.csr.auth.controller;

import com.csr.auth.dto.AuthResponse;
import com.csr.auth.dto.UserResponse;
import com.csr.auth.service.AuthService;
import com.csr.common.BusinessException;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.auth.repository.TokenBlacklistRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    // === 登录端点测试 ===

    @Test
    @DisplayName("POST /auth/login 成功返回 200 + Token")
    void login_success() throws Exception {
        AuthResponse mockResponse = new AuthResponse(
                "access_token", "refresh_token",
                new UserResponse(1L, "testuser", "测试用户", null, null, null, "USER", "2026-01-01T00:00:00Z")
        );
        when(authService.login(any())).thenReturn(mockResponse);

        String body = """
                {"username":"testuser","password":"password123"}
                """;

        mockMvc.perform(post("/api/v2/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("access_token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh_token"))
                .andExpect(jsonPath("$.data.user.username").value("testuser"));
    }

    @Test
    @DisplayName("POST /auth/login 参数校验失败返回 400")
    void login_validationFail() throws Exception {
        String body = """
                {"username":"","password":""}
                """;

        mockMvc.perform(post("/api/v2/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /auth/login 用户名密码错误返回 401")
    void login_wrongCredentials() throws Exception {
        when(authService.login(any())).thenThrow(new BusinessException(401, "用户名或密码错误"));

        String body = """
                {"username":"unknown","password":"wrong"}
                """;

        mockMvc.perform(post("/api/v2/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    // === 注册端点测试 ===

    @Test
    @DisplayName("POST /auth/register 成功返回 201")
    void register_success() throws Exception {
        AuthResponse mockResponse = new AuthResponse(
                "at", "rt",
                new UserResponse(2L, "newuser", "新用户", null, null, null, "USER", "2026-01-01T00:00:00Z")
        );
        when(authService.register(any())).thenReturn(mockResponse);

        String body = """
                {"username":"newuser","password":"password123","displayName":"新用户"}
                """;

        mockMvc.perform(post("/api/v2/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.user.username").value("newuser"));
    }

    // === 刷新 Token 端点测试 ===

    @Test
    @DisplayName("POST /auth/refresh 成功返回新 accessToken")
    void refresh_success() throws Exception {
        when(authService.refreshToken("valid_rt")).thenReturn("new_access_token");

        mockMvc.perform(post("/api/v2/auth/refresh")
                        .header("X-Refresh-Token", "valid_rt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("new_access_token"));
    }

    @Test
    @DisplayName("POST /auth/refresh 缺少 Token 返回 401")
    void refresh_missingToken() throws Exception {
        mockMvc.perform(post("/api/v2/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    // === 登出端点测试 ===

    @Test
    @DisplayName("POST /auth/logout 带 Token 成功返回消息")
    void logout_withToken() throws Exception {
        mockMvc.perform(post("/api/v2/auth/logout")
                        .header("Authorization", "Bearer some_token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.message").value("登出成功"));
    }

    @Test
    @DisplayName("POST /auth/logout 不带 Token 也应返回 200")
    void logout_withoutToken() throws Exception {
        mockMvc.perform(post("/api/v2/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.message").value("登出成功"));
    }
}
