package com.csr.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import com.csr.auth.dto.AuthResponse;
import com.csr.auth.dto.LoginRequest;
import com.csr.auth.dto.RegisterRequest;
import com.csr.auth.service.AuthService;
import com.csr.common.ApiResponse;
import com.csr.common.BusinessException;
import com.csr.common.RateLimit;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @RateLimit(maxRequests = 10, windowSeconds = 60)
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                           HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ApiResponse.success(authResponse);
    }

    @RateLimit(maxRequests = 3, windowSeconds = 60)
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                              HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ApiResponse.success(authResponse);
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
    public ApiResponse<Map<String, String>> logout(HttpServletRequest request,
                                                   HttpServletResponse response) {
        // 提取 access token
        String authHeader = request.getHeader("Authorization");
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }
        // 提取 refresh token（从 cookie 中），一并加入黑名单
        String refreshToken = extractRefreshToken(request);
        authService.logout(accessToken, refreshToken);
        clearRefreshTokenCookie(response);
        return ApiResponse.success(Map.of("message", "登出成功"));
    }

    /**
     * 设置 httpOnly Cookie 携带 Refresh Token。
     * 生产环境通过反向代理统一域，SameSite=Lax 即可；
     * 纯本地开发跨端口时通过 Vite proxy 解决同源问题。
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 天，与 refresh token 过期时间对齐
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    /**
     * 清除 Refresh Token Cookie（登出时调用）。
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private String extractRefreshToken(HttpServletRequest request) {
        // 优先从 cookie 获取（httpOnly Cookie，XSS 安全）
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        // 兜底：从 header 获取（仅用于过渡阶段或本地开发未配置 proxy 时）
        String headerToken = request.getHeader("X-Refresh-Token");
        return headerToken;
    }
}