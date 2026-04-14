package com.csr.dashboard.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.dto.DistributionItem;
import com.csr.dashboard.dto.TopParticipantItem;
import com.csr.dashboard.dto.TrendItem;
import com.csr.dashboard.service.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * DashboardController 功能测试（跳过 Security Filter，验证 HTTP 请求/响应）
 */
@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class DashboardControllerTest {

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
    @DisplayName("GET /dashboard/stats 返回统计数据")
    void getStats_success() throws Exception {
        DashboardStatsResponse stats = new DashboardStatsResponse(10, 200, 5000.0, 25);
        when(dashboardService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/v2/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.totalActivities").value(10))
                .andExpect(jsonPath("$.data.totalParticipations").value(200))
                .andExpect(jsonPath("$.data.totalDonation").value(5000.0))
                .andExpect(jsonPath("$.data.monthlyNew").value(25));
    }

    @Test
    @DisplayName("GET /dashboard/trends 返回趋势数据")
    void getTrends_success() throws Exception {
        List<TrendItem> trends = List.of(
                new TrendItem("2026-03", 50),
                new TrendItem("2026-04", 30)
        );
        when(dashboardService.getTrends()).thenReturn(trends);

        mockMvc.perform(get("/api/v2/dashboard/trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].month").value("2026-03"))
                .andExpect(jsonPath("$.data[0].count").value(50));
    }

    @Test
    @DisplayName("GET /dashboard/distribution 返回分布数据")
    void getDistribution_success() throws Exception {
        List<DistributionItem> dist = List.of(
                new DistributionItem("VOLUNTEER", 6, 60.0),
                new DistributionItem("DONATION", 4, 40.0)
        );
        when(dashboardService.getDistribution()).thenReturn(dist);

        mockMvc.perform(get("/api/v2/dashboard/distribution"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].templateType").value("VOLUNTEER"))
                .andExpect(jsonPath("$.data[0].percentage").value(60.0));
    }

    @Test
    @DisplayName("GET /dashboard/top-participants 返回 Top 10 员工")
    void getTopParticipants_success() throws Exception {
        List<TopParticipantItem> top = List.of(
                new TopParticipantItem(1L, "张三", 15),
                new TopParticipantItem(2L, "李四", 10)
        );
        when(dashboardService.getTopParticipants()).thenReturn(top);

        mockMvc.perform(get("/api/v2/dashboard/top-participants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].displayName").value("张三"))
                .andExpect(jsonPath("$.data[0].count").value(15));
    }
}
