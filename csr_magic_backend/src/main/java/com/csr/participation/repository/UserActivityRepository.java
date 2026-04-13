package com.csr.participation.repository;

import com.csr.participation.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Optional<UserActivity> findByUserIdAndActivityId(Long userId, Long activityId);

    boolean existsByUserIdAndActivityId(Long userId, Long activityId);

    long countByActivityId(Long activityId);

    long countByUserId(Long userId);

    List<UserActivity> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    Page<UserActivity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query(value = """
        SELECT COALESCE(SUM(
            EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600.0
        ), 0)
        FROM csr_v2.user_activity ua
        JOIN csr_v2.activity a ON ua.activity_id = a.id
        WHERE ua.user_id = :userId
          AND ua.state = 'APPROVED'
          AND a.template_type = 'VOLUNTEER'
          AND a.start_time IS NOT NULL
          AND a.end_time IS NOT NULL
        """, nativeQuery = true)
    double sumVolunteerHoursByUserId(@Param("userId") Long userId);

    @Query(value = """
        SELECT COALESCE(SUM(
            CASE WHEN ua.form_data IS NOT NULL AND ua.form_data::text != 'null'
                 THEN COALESCE((ua.form_data->>'amount')::numeric, 0)
                 ELSE 0
            END
        ), 0)
        FROM csr_v2.user_activity ua
        JOIN csr_v2.activity a ON ua.activity_id = a.id
        WHERE ua.user_id = :userId
          AND ua.state = 'APPROVED'
          AND a.template_type = 'DONATION'
        """, nativeQuery = true)
    double sumDonationByUserId(@Param("userId") Long userId);
}
