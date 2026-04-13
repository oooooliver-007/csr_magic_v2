package com.csr.participation.repository;

import com.csr.participation.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Optional<UserActivity> findByUserIdAndActivityId(Long userId, Long activityId);

    boolean existsByUserIdAndActivityId(Long userId, Long activityId);

    long countByActivityId(Long activityId);
}
