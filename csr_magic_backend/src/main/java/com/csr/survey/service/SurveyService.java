package com.csr.survey.service;

import com.csr.survey.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SurveyService {

    AiGeneratedSurveyResponse generateWithAi(GenerateSurveyRequest request);

    SurveyResponse create(CreateSurveyRequest request);

    SurveyResponse getByActivityId(Long activityId);

    SurveyResponse getById(Long id);

    Page<SurveyResponse> list(String keyword, String status, Pageable pageable);

    void publish(Long id);

    void close(Long id);

    void delete(Long id);

    void submit(SubmitSurveyRequest request, Long userId);

    boolean hasUserSubmitted(Long surveyId, Long userId);

    Page<SurveyResultResponse> getResults(Long surveyId, Pageable pageable);

    SurveyStatsResponse getStats(Long surveyId);
}
