package com.csr.survey.repository;

import com.csr.survey.entity.Survey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SurveyRepository extends JpaRepository<Survey, Long> {

    Optional<Survey> findByActivityId(Long activityId);

    boolean existsByActivityId(Long activityId);

    @Query("SELECT s FROM Survey s WHERE " +
           "(:keyword = '' OR LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status = '' OR s.status = :status) " +
           "ORDER BY s.createdAt DESC")
    Page<Survey> findByFilters(@Param("keyword") String keyword,
                               @Param("status") String status,
                               Pageable pageable);
}
