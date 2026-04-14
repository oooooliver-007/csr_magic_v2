package com.csr.dashboard.controller;

import com.csr.common.ApiResponse;
import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.dto.DistributionItem;
import com.csr.dashboard.dto.TopParticipantItem;
import com.csr.dashboard.dto.TrendItem;
import com.csr.dashboard.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 数据看板 Controller — 4 个只读统计端点
 */
@RestController
@RequestMapping("/api/v2/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ApiResponse<DashboardStatsResponse> getStats() {
        return ApiResponse.success(dashboardService.getStats());
    }

    @GetMapping("/trends")
    public ApiResponse<List<TrendItem>> getTrends() {
        return ApiResponse.success(dashboardService.getTrends());
    }

    @GetMapping("/distribution")
    public ApiResponse<List<DistributionItem>> getDistribution() {
        return ApiResponse.success(dashboardService.getDistribution());
    }

    @GetMapping("/top-participants")
    public ApiResponse<List<TopParticipantItem>> getTopParticipants() {
        return ApiResponse.success(dashboardService.getTopParticipants());
    }
}
