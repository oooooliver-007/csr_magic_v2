package com.csr.dashboard.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.service.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DashboardController 权限测试
 * 使用 @EnableMethodSecurity 激活 @PreAuthorize 注解
 * 使用 addFilters=false 跳过 HTTP Filter 链（JwtAuthFilter mock 会中断 chain）
 * 权限由 @PreAuthorize 方法级安全控制
 */
@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@EnableMethodSecurity
@Import(GlobalExceptionHandler.class)
class DashboardControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Test
    @DisplayName("匿名用户访问 /dashboard/stats 返回 403")
    @WithAnonymousUser
    void stats_anonymous_returns403() throws Exception {
        mockMvc.perform(get("/api/v2/dashboard/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("普通用户访问 /dashboard/stats 返回 403")
    @WithMockUser(roles = "USER")
    void stats_userRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v2/dashboard/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN 用户访问 /dashboard/stats 返回 200")
    @WithMockUser(roles = "ADMIN")
    void stats_adminRole_returns200() throws Exception {
        DashboardStatsResponse stats = new DashboardStatsResponse(0, 0, 0.0, 0);
        when(dashboardService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/v2/dashboard/stats"))
                .andExpect(status().isOk());
    }
}
