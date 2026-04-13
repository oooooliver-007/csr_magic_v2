package com.csr.user.service;

import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.user.dto.MyStatsResponse;
import com.csr.user.dto.UpdateMeRequest;
import com.csr.user.dto.UpdateUserRequest;
import com.csr.user.dto.UserDetailResponse;
import com.csr.user.dto.UserResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final UserActivityRepository userActivityRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           UserActivityRepository userActivityRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userActivityRepository = userActivityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Page<UserResponse> list(String keyword, String region, Pageable pageable) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String rg = (region != null && !region.isBlank()) ? region.trim() : null;
        Page<User> page = userRepository.findByFilters(kw, rg, pageable);
        return page.map(UserResponse::from);
    }

    @Override
    public UserDetailResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        long participationCount = userActivityRepository.countByUserId(id);
        List<UserActivity> recentActivities = userActivityRepository.findTop5ByUserIdOrderByCreatedAtDesc(id);

        List<UserDetailResponse.RecentParticipation> recentParticipations = recentActivities.stream()
                .map(ua -> new UserDetailResponse.RecentParticipation(
                        ua.getId(),
                        ua.getActivity().getName(),
                        ua.getState().name(),
                        ua.getCreatedAt().toString()
                ))
                .toList();

        return UserDetailResponse.from(user, participationCount, recentParticipations);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }
        if (request.realName() != null) {
            user.setRealName(request.realName());
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }
        if (request.region() != null) {
            user.setRegion(request.region());
        }
        if (request.role() != null) {
            if (!"USER".equals(request.role()) && !"ADMIN".equals(request.role())) {
                throw new BusinessException(400, "无效的角色值，只允许 USER 或 ADMIN");
            }
            user.setRole(request.role());
        }

        User saved = userRepository.save(user);
        log.info("更新用户信息: userId={}", id);
        return UserResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException(404, "用户不存在");
        }
        userRepository.deleteById(id);
        log.info("删除用户: userId={}", id);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("重置用户密码: userId={}", id);
    }

    @Override
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return UserResponse.from(user);
    }

    @Override
    @Transactional
    public UserResponse updateMe(Long userId, UpdateMeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }
        if (request.realName() != null) {
            user.setRealName(request.realName());
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }
        if (request.region() != null) {
            user.setRegion(request.region());
        }

        User saved = userRepository.save(user);
        log.info("用户更新个人信息: userId={}", userId);
        return UserResponse.from(saved);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessException(400, "当前密码不正确");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("用户修改密码: userId={}", userId);
    }

    @Override
    public MyStatsResponse getMyStats(Long userId) {
        long activityCount = userActivityRepository.countByUserId(userId);
        double volunteerHours = userActivityRepository.sumVolunteerHoursByUserId(userId);
        double totalDonation = userActivityRepository.sumDonationByUserId(userId);
        return new MyStatsResponse(activityCount, volunteerHours, totalDonation);
    }
}
