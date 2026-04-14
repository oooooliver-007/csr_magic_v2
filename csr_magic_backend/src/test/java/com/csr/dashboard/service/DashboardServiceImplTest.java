package com.csr.dashboard.service;

import com.csr.activity.repository.ActivityRepository;
import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.dto.DistributionItem;
import com.csr.dashboard.dto.TopParticipantItem;
import com.csr.dashboard.dto.TrendItem;
import com.csr.participation.repository.UserActivityRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    // === getStats 测试 ===

    @Test
    @DisplayName("getStats 返回正确的统计数据")
    void getStats_success() {
        when(activityRepository.count()).thenReturn(10L);
        when(userActivityRepository.count()).thenReturn(200L);
        when(userActivityRepository.sumAllDonations()).thenReturn(5000.0);
        when(userActivityRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(25L);

        DashboardStatsResponse result = dashboardService.getStats();

        assertThat(result.totalActivities()).isEqualTo(10L);
        assertThat(result.totalParticipations()).isEqualTo(200L);
        assertThat(result.totalDonation()).isEqualTo(5000.0);
        assertThat(result.monthlyNew()).isEqualTo(25L);
    }

    @Test
    @DisplayName("getStats 无数据时返回零值")
    void getStats_empty() {
        when(activityRepository.count()).thenReturn(0L);
        when(userActivityRepository.count()).thenReturn(0L);
        when(userActivityRepository.sumAllDonations()).thenReturn(0.0);
        when(userActivityRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(0L);

        DashboardStatsResponse result = dashboardService.getStats();

        assertThat(result.totalActivities()).isZero();
        assertThat(result.totalParticipations()).isZero();
        assertThat(result.totalDonation()).isZero();
        assertThat(result.monthlyNew()).isZero();
    }

    // === getTrends 测试 ===

    @Test
    @DisplayName("getTrends 返回 12 个月数据，缺失月份填 0")
    void getTrends_fillsMissingMonths() {
        // 只返回 2 个月的数据
        List<Object[]> rows = List.of(
                new Object[]{"2026-03", 50L},
                new Object[]{"2026-04", 30L}
        );
        when(userActivityRepository.countMonthlyParticipations(any(Instant.class))).thenReturn(rows);

        List<TrendItem> result = dashboardService.getTrends();

        assertThat(result).hasSize(12);
        // 验证有数据的月份
        TrendItem march = result.stream().filter(t -> t.month().equals("2026-03")).findFirst().orElse(null);
        assertThat(march).isNotNull();
        assertThat(march.count()).isEqualTo(50L);
    }

    @Test
    @DisplayName("getTrends 无数据时返回全 0")
    void getTrends_noData() {
        when(userActivityRepository.countMonthlyParticipations(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        List<TrendItem> result = dashboardService.getTrends();

        assertThat(result).hasSize(12);
        assertThat(result).allMatch(t -> t.count() == 0);
    }

    // === getDistribution 测试 ===

    @Test
    @DisplayName("getDistribution 正确计算百分比")
    void getDistribution_percentages() {
        List<Object[]> rows = List.of(
                new Object[]{"VOLUNTEER", 6L},
                new Object[]{"DONATION", 4L}
        );
        when(activityRepository.countByTemplateType()).thenReturn(rows);

        List<DistributionItem> result = dashboardService.getDistribution();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).templateType()).isEqualTo("VOLUNTEER");
        assertThat(result.get(0).percentage()).isEqualTo(60.0);
        assertThat(result.get(1).percentage()).isEqualTo(40.0);
    }

    @Test
    @DisplayName("getDistribution 无数据时返回空列表")
    void getDistribution_empty() {
        when(activityRepository.countByTemplateType()).thenReturn(Collections.emptyList());

        List<DistributionItem> result = dashboardService.getDistribution();

        assertThat(result).isEmpty();
    }

    // === getTopParticipants 测试 ===

    @Test
    @DisplayName("getTopParticipants 返回正确排序的数据")
    void getTopParticipants_success() {
        List<Object[]> rows = List.of(
                new Object[]{1L, "张三", 15L},
                new Object[]{2L, "李四", 10L}
        );
        when(userActivityRepository.findTopParticipants(10)).thenReturn(rows);

        List<TopParticipantItem> result = dashboardService.getTopParticipants();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).displayName()).isEqualTo("张三");
        assertThat(result.get(0).count()).isEqualTo(15L);
        assertThat(result.get(1).displayName()).isEqualTo("李四");
    }

    @Test
    @DisplayName("getTopParticipants 无数据时返回空列表")
    void getTopParticipants_empty() {
        when(userActivityRepository.findTopParticipants(10)).thenReturn(Collections.emptyList());

        List<TopParticipantItem> result = dashboardService.getTopParticipants();

        assertThat(result).isEmpty();
    }
}
