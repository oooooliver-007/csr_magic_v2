package com.csr.participation.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.exception.ParticipationNotFoundException;
import com.csr.participation.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ParticipationServiceImpl implements ParticipationService {

    private static final Logger log = LoggerFactory.getLogger(ParticipationServiceImpl.class);

    private final UserActivityRepository userActivityRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public ParticipationServiceImpl(UserActivityRepository userActivityRepository,
                                    ActivityRepository activityRepository,
                                    UserRepository userRepository) {
        this.userActivityRepository = userActivityRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
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

        if ("ENDED".equals(participation.getActivity().getStatus())) {
            throw new BusinessException(400, "活动已结束，无法退出");
        }

        userActivityRepository.delete(participation);
        log.info("用户 {} 退出活动，参与记录 ID: {}", userId, participationId);
    }
}
