package com.csr.participation.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.participation.dto.MyParticipationResponse;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.ReviewRequest;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.exception.ParticipationNotFoundException;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ParticipationServiceImpl implements ParticipationService {

    private static final Logger log = LoggerFactory.getLogger(ParticipationServiceImpl.class);

    private final UserActivityRepository userActivityRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ParticipationServiceImpl(UserActivityRepository userActivityRepository,
                                    ActivityRepository activityRepository,
                                    UserRepository userRepository,
                                    NotificationService notificationService) {
        this.userActivityRepository = userActivityRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public ParticipationResponse signup(Long userId, SignupRequest request) {
        Activity activity = activityRepository.findById(request.activityId())
            .orElseThrow(() -> new ActivityNotFoundException(request.activityId()));

        // 检查活动状态
        if ("ENDED".equals(activity.getStatus())) {
            throw new BusinessException(400, "活动已结束，无法报名");
        }

        // 检查是否已报名
        if (userActivityRepository.existsByUserIdAndActivityId(userId, request.activityId())) {
            throw new BusinessException(400, "您已报名此活动，请勿重复报名");
        }

        // 检查名额
        if (activity.getMaxParticipants() != null) {
            long currentCount = userActivityRepository.countByActivityId(request.activityId());
            if (currentCount >= activity.getMaxParticipants()) {
                throw new BusinessException(400, "活动名额已满");
            }
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        UserActivity participation = new UserActivity();
        participation.setUser(user);
        participation.setActivity(activity);
        participation.setState(ParticipationState.PENDING);
        participation.setFormData(request.formData());

        UserActivity saved = userActivityRepository.save(participation);
        log.info("用户 {} 报名活动 {} 成功，参与记录 ID: {}", userId, request.activityId(), saved.getId());
        return ParticipationResponse.from(saved);
    }

    @Override
    @Transactional
    public void withdraw(Long participationId, Long userId) {
        UserActivity participation = userActivityRepository.findById(participationId)
            .orElseThrow(() -> new ParticipationNotFoundException(participationId));

        if (!participation.getUser().getId().equals(userId)) {
            throw new BusinessException(403, "无权操作此参与记录");
        }

        // 仅 PENDING 状态可退出（spec 要求）
        if (participation.getState() != ParticipationState.PENDING) {
            throw new BusinessException(400, "仅待审核状态可退出活动");
        }

        userActivityRepository.delete(participation);
        log.info("用户 {} 退出活动，参与记录 ID: {}", userId, participationId);
    }

    @Override
    public Page<MyParticipationResponse> getMyParticipations(Long userId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(MyParticipationResponse::from);
    }

    @Override
    public Page<ParticipationResponse> adminList(Long eventId, Long activityId, Long userId,
                                                  ParticipationState state, String keyword, Pageable pageable) {
        String stateStr = state != null ? state.name() : null;
        return userActivityRepository.findByFilters(eventId, activityId, userId, stateStr, keyword, pageable)
                .map(ParticipationResponse::from);
    }

    @Override
    @Transactional
    public ParticipationResponse review(Long participationId, Long adminUserId, ReviewRequest request) {
        UserActivity participation = userActivityRepository.findById(participationId)
            .orElseThrow(() -> new ParticipationNotFoundException(participationId));

        // 仅 PENDING 或 RE_SUBMITTED 状态可审核
        if (participation.getState() != ParticipationState.PENDING
                && participation.getState() != ParticipationState.RE_SUBMITTED) {
            throw new BusinessException(400, "当前状态不可审核");
        }

        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new BusinessException(404, "管理员不存在"));

        if (request.action() == ReviewRequest.Action.APPROVE) {
            participation.setState(ParticipationState.APPROVED);
        } else {
            if (request.rejectReason() == null || request.rejectReason().isBlank()) {
                throw new BusinessException(400, "驳回时必须填写原因");
            }
            participation.setState(ParticipationState.REJECTED);
            participation.setRejectReason(request.rejectReason());
        }

        participation.setReviewedBy(admin);
        participation.setReviewedAt(java.time.Instant.now());

        UserActivity saved = userActivityRepository.save(participation);
        log.info("管理员 {} 审核参与记录 {}，操作: {}", adminUserId, participationId, request.action());

        // 发送站内通知给员工
        String activityName = participation.getActivity().getName();
        if (request.action() == ReviewRequest.Action.APPROVE) {
            notificationService.send(
                participation.getUser(),
                "REVIEW_APPROVED",
                "报名审核通过",
                "您报名的活动「" + activityName + "」已审核通过"
            );
        } else {
            notificationService.send(
                participation.getUser(),
                "REVIEW_REJECTED",
                "报名审核未通过",
                "您报名的活动「" + activityName + "」未通过审核，原因：" + request.rejectReason()
            );
        }

        return ParticipationResponse.from(saved);
    }
}
