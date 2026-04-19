package com.csr.participation.controller;

import com.csr.common.ApiResponse;
import com.csr.participation.dto.MyParticipationResponse;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.ResubmitRequest;
import com.csr.participation.dto.ReviewRequest;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.service.ParticipationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v2/participations")
public class ParticipationController {

    private final ParticipationService participationService;

    public ParticipationController(ParticipationService participationService) {
        this.participationService = participationService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ParticipationResponse> signup(@Valid @RequestBody SignupRequest request) {
        Long userId = getCurrentUserId();
        return ApiResponse.success(participationService.signup(userId, request));
    }

    @PostMapping("/{id}/resubmit")
    public ApiResponse<ParticipationResponse> resubmit(
            @PathVariable Long id,
            @RequestBody ResubmitRequest request) {
        Long userId = getCurrentUserId();
        return ApiResponse.success(participationService.resubmit(id, userId, request));
    }

    @PostMapping("/{id}/withdraw")
    public ApiResponse<Void> withdraw(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        participationService.withdraw(id, userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/my")
    public ApiResponse<Page<MyParticipationResponse>> getMyParticipations(Pageable pageable) {
        Long userId = getCurrentUserId();
        return ApiResponse.success(participationService.getMyParticipations(userId, pageable));
    }

    /**
     * 管理端参与列表（支持多维筛选）
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<ParticipationResponse>> adminList(
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) Long activityId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) ParticipationState state,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdTo,
            Pageable pageable) {
        return ApiResponse.success(
            participationService.adminList(eventId, activityId, userId, state, keyword, createdFrom, createdTo, pageable));
    }

    /**
     * 审核参与记录（通过/驳回）
     */
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ParticipationResponse> review(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request) {
        Long adminUserId = getCurrentUserId();
        return ApiResponse.success(participationService.review(id, adminUserId, request));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
