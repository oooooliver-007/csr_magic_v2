package com.csr.survey.repository;

import com.csr.survey.entity.SurveyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    Optional<SurveyResponse> findBySurveyIdAndUserId(Long surveyId, Long userId);

    boolean existsBySurveyIdAndUserId(Long surveyId, Long userId);

    long countBySurveyId(Long surveyId);

    @Query("SELECT COALESCE(AVG(r.sentimentScore), 0) FROM SurveyResponse r WHERE r.surveyId = :surveyId")
    Double getAverageSentimentBySurveyId(@Param("surveyId") Long surveyId);

    Page<SurveyResponse> findBySurveyId(Long surveyId, Pageable pageable);
}
