package com.csr.poster.controller;

import com.csr.common.ApiResponse;
import com.csr.common.RateLimit;
import com.csr.common.BusinessException;
import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import com.csr.poster.service.PosterService;
import org.springframework.beans.factory.annotation.Value;
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
    
    @Value("${app.poster-callback-token:}")
    private String callbackToken;

    public PosterController(PosterService posterService) {
        this.posterService = posterService;
    }

    @RateLimit(maxRequests = 5, windowSeconds = 60)
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

    /**
     * AI 服务回调端点 — 由 AI 服务在生成完成后主动调用。
     * 通过 X-Callback-Token 头部进行服务间认证。
     */
    @PostMapping("/{taskId}/callback")
    public ApiResponse<Void> callback(
            @PathVariable String taskId,
            @RequestHeader("X-Callback-Token") String token,
            @RequestBody java.util.Map<String, String> body) {
        if (callbackToken == null || callbackToken.isBlank() || !callbackToken.equals(token)) {
            throw new BusinessException(403, "无效的回调令牌");
        }
        String status = body.getOrDefault("status", "FAILED");
        String posterUrl = body.getOrDefault("poster_url", null);
        String errorMessage = body.getOrDefault("error_message", null);
        posterService.callbackUpdate(taskId, status, posterUrl, errorMessage);
        return ApiResponse.success(null);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}