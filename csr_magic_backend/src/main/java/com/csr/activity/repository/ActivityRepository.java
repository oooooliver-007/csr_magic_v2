package com.csr.activity.repository;

import com.csr.activity.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /** 看板：按活动模板类型统计数量 */
    @Query(value = """
        SELECT a.template_type, COUNT(*) AS cnt
        FROM csr_v2.activity a
        GROUP BY a.template_type
        ORDER BY cnt DESC
        """, nativeQuery = true)
    List<Object[]> countByTemplateType();

    @Query(value = "SELECT * FROM activity a WHERE "
         + "(:eventId IS NULL OR a.event_id = CAST(:eventId AS BIGINT)) AND "
         + "(CAST(:status AS TEXT) IS NULL OR a.status = CAST(:status AS TEXT)) AND "
         + "(CAST(:templateType AS TEXT) IS NULL OR a.template_type = CAST(:templateType AS TEXT)) AND "
         + "(CAST(:keyword AS TEXT) IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')))",
         countQuery = "SELECT count(*) FROM activity a WHERE "
         + "(:eventId IS NULL OR a.event_id = CAST(:eventId AS BIGINT)) AND "
         + "(CAST(:status AS TEXT) IS NULL OR a.status = CAST(:status AS TEXT)) AND "
         + "(CAST(:templateType AS TEXT) IS NULL OR a.template_type = CAST(:templateType AS TEXT)) AND "
         + "(CAST(:keyword AS TEXT) IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS TEXT), '%')))",
         nativeQuery = true)
    Page<Activity> findByFilters(
            @Param("eventId") Long eventId,
            @Param("status") String status,
            @Param("templateType") String templateType,
            @Param("keyword") String keyword,
            Pageable pageable);
}
