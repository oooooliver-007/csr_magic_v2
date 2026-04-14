package com.csr.dashboard.service;

import com.csr.activity.repository.ActivityRepository;
import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.dto.DistributionItem;
import com.csr.dashboard.dto.TopParticipantItem;
import com.csr.dashboard.dto.TrendItem;
import com.csr.participation.repository.UserActivityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * 数据看板 Service 实现
 */
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final ActivityRepository activityRepository;
    private final UserActivityRepository userActivityRepository;

    public DashboardServiceImpl(ActivityRepository activityRepository,
                                UserActivityRepository userActivityRepository) {
        this.activityRepository = activityRepository;
        this.userActivityRepository = userActivityRepository;
    }

    @Override
    public DashboardStatsResponse getStats() {
        long totalActivities = activityRepository.count();
        long totalParticipations = userActivityRepository.count();

        // 累计捐赠额（所有已批准的 DONATION 类型参与记录的 amount 合计）
        double totalDonation = userActivityRepository.sumAllDonations();

        // 本月新增参与人次
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = currentMonth.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant monthEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        long monthlyNew = userActivityRepository.countByCreatedAtBetween(monthStart, monthEnd);

        return new DashboardStatsResponse(totalActivities, totalParticipations, totalDonation, monthlyNew);
    }

    @Override
    public List<TrendItem> getTrends() {
        // 近 12 个月（含当月）每月参与人次
        YearMonth current = YearMonth.now(ZoneOffset.UTC);
        YearMonth start = current.minusMonths(11);
        Instant startInstant = start.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Object[]> rows = userActivityRepository.countMonthlyParticipations(startInstant);

        // 构建 12 个月的完整数据（无数据月份填 0）
        List<TrendItem> result = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            YearMonth ym = start.plusMonths(i);
            String monthLabel = ym.toString(); // "2026-01" 格式
            long count = 0;
            for (Object[] row : rows) {
                String rowMonth = (String) row[0];
                if (monthLabel.equals(rowMonth)) {
                    count = ((Number) row[1]).longValue();
                    break;
                }
            }
            result.add(new TrendItem(monthLabel, count));
        }
        return result;
    }

    @Override
    public List<DistributionItem> getDistribution() {
        List<Object[]> rows = activityRepository.countByTemplateType();
        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();

        List<DistributionItem> result = new ArrayList<>();
        for (Object[] row : rows) {
            String templateType = (String) row[0];
            long count = ((Number) row[1]).longValue();
            double percentage = total > 0 ? Math.round(count * 1000.0 / total) / 10.0 : 0;
            result.add(new DistributionItem(templateType, count, percentage));
        }
        return result;
    }

    @Override
    public List<TopParticipantItem> getTopParticipants() {
        List<Object[]> rows = userActivityRepository.findTopParticipants(10);
        List<TopParticipantItem> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long userId = ((Number) row[0]).longValue();
            String displayName = (String) row[1];
            long count = ((Number) row[2]).longValue();
            result.add(new TopParticipantItem(userId, displayName, count));
        }
        return result;
    }
}
