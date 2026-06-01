package com.csr.survey.controller;

import com.csr.common.ApiResponse;
import com.csr.survey.dto.*;
import com.csr.survey.service.SurveyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/surveys")
public class SurveyController {

    private final SurveyService surveyService;

    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AiGeneratedSurveyResponse> generateWithAi(
            @Valid @RequestBody GenerateSurveyRequest request) {
        return ApiResponse.success(surveyService.generateWithAi(request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SurveyResponse> create(@Valid @RequestBody CreateSurveyRequest request) {
        return ApiResponse.success(surveyService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<SurveyResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ApiResponse.success(surveyService.list(keyword, status, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<SurveyResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(surveyService.getById(id));
    }

    @GetMapping("/by-activity/{activityId}")
    public ApiResponse<SurveyResponse> getByActivityId(@PathVariable Long activityId) {
        return ApiResponse.success(surveyService.getByActivityId(activityId));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> publish(@PathVariable Long id) {
        surveyService.publish(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> close(@PathVariable Long id) {
        surveyService.close(id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        surveyService.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/submit")
    public ApiResponse<Void> submit(@Valid @RequestBody SubmitSurveyRequest request,
                                     Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        surveyService.submit(request, userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/{surveyId}/submitted")
    public ApiResponse<Boolean> hasUserSubmitted(@PathVariable Long surveyId,
                                                  Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ApiResponse.success(surveyService.hasUserSubmitted(surveyId, userId));
    }

    @GetMapping("/{surveyId}/results")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<SurveyResultResponse>> getResults(
            @PathVariable Long surveyId, Pageable pageable) {
        return ApiResponse.success(surveyService.getResults(surveyId, pageable));
    }

    @GetMapping("/{surveyId}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SurveyStatsResponse> getStats(@PathVariable Long surveyId) {
        return ApiResponse.success(surveyService.getStats(surveyId));
    }
}
