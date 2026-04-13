package com.csr.activity.controller;

import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import com.csr.activity.service.ActivityService;
import com.csr.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ApiResponse<Page<ActivityResponse>> list(
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ApiResponse.success(activityService.list(eventId, status, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(activityService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ActivityResponse> create(@Valid @RequestBody CreateActivityRequest request) {
        return ApiResponse.success(activityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ActivityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateActivityRequest request) {
        return ApiResponse.success(activityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return ApiResponse.success(null);
    }
}
