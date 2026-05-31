package com.csr.poster.controller;

import com.csr.common.ApiResponse;
import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import com.csr.poster.service.PosterService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/posters")
public class PosterController {

    private final PosterService posterService;

    public PosterController(PosterService posterService) {
        this.posterService = posterService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GenerateTaskResponse> generate(@Valid @RequestBody GeneratePosterRequest request) {
        return ApiResponse.success(posterService.generate(request, getCurrentUserId()));
    }

    @GetMapping("/{taskId}/status")
    public ApiResponse<PosterStatusResponse> getStatus(@PathVariable String taskId) {
        return ApiResponse.success(posterService.getStatus(taskId, getCurrentUserId()));
    }

    @GetMapping("/my")
    public ApiResponse<Page<PosterResponse>> getMyPosters(Pageable pageable) {
        return ApiResponse.success(posterService.getMyPosters(getCurrentUserId(), pageable));
    }

    @GetMapping("/{taskId}/image")
    public ResponseEntity<byte[]> getPosterImage(@PathVariable String taskId) {
        // 图片端点 permitAll，不依赖认证；通过 taskId（UUID）隐式鉴权
        byte[] imageData = posterService.getPosterImageByTaskId(taskId);
        if (imageData == null || imageData.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageData);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
