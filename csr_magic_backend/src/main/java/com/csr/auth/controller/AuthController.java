package com.csr.auth.controller;

import com.csr.auth.dto.AuthResponse;
import com.csr.auth.dto.LoginRequest;
import com.csr.auth.dto.RegisterRequest;
import com.csr.auth.service.AuthService;
import com.csr.common.ApiResponse;
import com.csr.common.BusinessException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<Map<String, String>> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshToken(request);
        if (refreshToken == null) {
            throw new BusinessException(401, "缺少 Refresh Token");
        }
        String newAccessToken = authService.refreshToken(refreshToken);
        return ApiResponse.success(Map.of("accessToken", newAccessToken));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ApiResponse.success(Map.of("message", "登出成功"));
    }

    private String extractRefreshToken(HttpServletRequest request) {
        // 优先从 cookie 获取
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        // 兜底：从请求体或 header 获取（前端 localStorage 方案）
        String headerToken = request.getHeader("X-Refresh-Token");
        return headerToken;
    }
}
