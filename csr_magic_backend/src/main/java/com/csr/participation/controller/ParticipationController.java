package com.csr.participation.controller;

import com.csr.common.ApiResponse;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.service.ParticipationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/{id}/withdraw")
    public ApiResponse<Void> withdraw(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        participationService.withdraw(id, userId);
        return ApiResponse.success(null);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
