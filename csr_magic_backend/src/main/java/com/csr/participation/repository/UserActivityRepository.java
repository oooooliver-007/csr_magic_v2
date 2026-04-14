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

    /**
     * 管理端筛选查询（支持 eventId / activityId / userId / state 筛选 + keyword 搜索）
     * 使用 nativeQuery + CAST 模式（Hibernate 6 + PostgreSQL null 参数类型推断问题）
     */
    @Query(value = "SELECT ua.* FROM user_activity ua "
         + "JOIN users u ON ua.user_id = u.id "
         + "JOIN activity a ON ua.activity_id = a.id "
         + "WHERE (:eventId IS NULL OR a.event_id = CAST(:eventId AS BIGINT)) "
         + "AND (:activityId IS NULL OR a.id = CAST(:activityId AS BIGINT)) "
         + "AND (:userId IS NULL OR u.id = CAST(:userId AS BIGINT)) "
         + "AND (CAST(:state AS TEXT) IS NULL OR ua.state = CAST(:state AS TEXT)) "
         + "AND (CAST(:keyword AS TEXT) IS NULL OR LOWER(u.display_name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')) "
         + "     OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')) "
         + "     OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%'))) "
         + "ORDER BY ua.created_at DESC",
         countQuery = "SELECT count(*) FROM user_activity ua "
         + "JOIN users u ON ua.user_id = u.id "
         + "JOIN activity a ON ua.activity_id = a.id "
         + "WHERE (:eventId IS NULL OR a.event_id = CAST(:eventId AS BIGINT)) "
         + "AND (:activityId IS NULL OR a.id = CAST(:activityId AS BIGINT)) "
         + "AND (:userId IS NULL OR u.id = CAST(:userId AS BIGINT)) "
         + "AND (CAST(:state AS TEXT) IS NULL OR ua.state = CAST(:state AS TEXT)) "
         + "AND (CAST(:keyword AS TEXT) IS NULL OR LOWER(u.display_name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')) "
         + "     OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')) "
         + "     OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')))",
         nativeQuery = true)
    Page<UserActivity> findByFilters(
        @Param("eventId") Long eventId,
        @Param("activityId") Long activityId,
        @Param("userId") Long userId,
        @Param("state") String state,
        @Param("keyword") String keyword,
        Pageable pageable
    );

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
