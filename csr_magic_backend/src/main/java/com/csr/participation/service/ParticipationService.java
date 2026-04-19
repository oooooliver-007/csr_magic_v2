package com.csr.participation.service;

import com.csr.participation.dto.MyParticipationResponse;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.ResubmitRequest;
import com.csr.participation.dto.ReviewRequest;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.ParticipationState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Instant;

public interface ParticipationService {

    ParticipationResponse signup(Long userId, SignupRequest request);

    /**
     * 驳回后重新提交：员工修改被驳回的报名记录并重新提交审核
     */
    ParticipationResponse resubmit(Long participationId, Long userId, ResubmitRequest request);

    void withdraw(Long participationId, Long userId);

    Page<MyParticipationResponse> getMyParticipations(Long userId, Pageable pageable);

    /**
     * 管理端参与列表（支持多维筛选）
     */
    Page<ParticipationResponse> adminList(Long eventId, Long activityId, Long userId,
                                          ParticipationState state, String keyword,
                                          Instant createdFrom, Instant createdTo, Pageable pageable);

    /**
     * 审核参与记录（通过/驳回）
     */
    ParticipationResponse review(Long participationId, Long adminUserId, ReviewRequest request);
}
