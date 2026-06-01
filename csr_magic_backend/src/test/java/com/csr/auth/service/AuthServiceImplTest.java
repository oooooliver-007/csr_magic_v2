package com.csr.auth.service;

import com.csr.auth.dto.AuthResponse;
import com.csr.auth.dto.LoginRequest;
import com.csr.auth.dto.RegisterRequest;
import com.csr.auth.entity.TokenBlacklist;
import com.csr.auth.entity.User;
import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.common.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private TokenBlacklistRepository tokenBlacklistRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encoded_password");
        testUser.setDisplayName("测试用户");
        testUser.setRole("USER");
        ReflectionTestUtils.setField(testUser, "createdAt", java.time.Instant.parse("2026-01-01T00:00:00Z"));
    }

    // === 登录测试 ===

    @Test
    @DisplayName("登录成功：返回 accessToken 和 refreshToken")
    void login_success() {
        LoginRequest request = new LoginRequest("testuser", "password123");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtUtil.generateAccessToken(1L, "testuser", "USER")).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken(1L)).thenReturn("refresh_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access_token", response.accessToken());
        assertEquals("refresh_token", response.refreshToken());
        assertEquals("testuser", response.user().username());
    }

    @Test
    @DisplayName("登录失败：用户名不存在抛出 401")
    void login_userNotFound() {
        LoginRequest request = new LoginRequest("unknown", "password123");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(401, ex.getCode());
    }

    @Test
    @DisplayName("登录失败：密码错误抛出 401")
    void login_wrongPassword() {
        LoginRequest request = new LoginRequest("testuser", "wrong");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong", "encoded_password")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(401, ex.getCode());
    }

    // === 注册测试 ===

    @Test
    @DisplayName("注册成功：返回 Token 和用户信息")
    void register_success() {
        RegisterRequest request = new RegisterRequest("newuser", "password123", "新用户", "北京", "MALE");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(2L);
            ReflectionTestUtils.setField(u, "createdAt", java.time.Instant.parse("2026-01-01T00:00:00Z"));
            return u;
        });
        when(jwtUtil.generateAccessToken(eq(2L), eq("newuser"), eq("USER"))).thenReturn("at");
        when(jwtUtil.generateRefreshToken(2L)).thenReturn("rt");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("at", response.accessToken());
        assertEquals("newuser", response.user().username());
    }

    @Test
    @DisplayName("注册失败：用户名已存在抛出 409")
    void register_duplicateUsername() {
        RegisterRequest request = new RegisterRequest("testuser", "password123", "测试", null, null);
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.register(request));
        assertEquals(409, ex.getCode());
    }

    // === Token 刷新测试 ===

    @Test
    @DisplayName("刷新 Token 成功：返回新 accessToken")
    void refreshToken_success() {
        String rt = "valid_refresh_token";

        when(jwtUtil.isTokenValid(rt)).thenReturn(true);
        when(jwtUtil.getJtiFromToken(rt)).thenReturn("jti-123");
        when(tokenBlacklistRepository.existsByJti("jti-123")).thenReturn(false);
        when(jwtUtil.getUserIdFromToken(rt)).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateAccessToken(1L, "testuser", "USER")).thenReturn("new_access_token");

        String newAt = authService.refreshToken(rt);

        assertEquals("new_access_token", newAt);
    }

    @Test
    @DisplayName("刷新 Token 失败：Token 无效抛出 401")
    void refreshToken_invalidToken() {
        when(jwtUtil.isTokenValid("invalid")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.refreshToken("invalid"));
        assertEquals(401, ex.getCode());
    }

    @Test
    @DisplayName("刷新 Token 失败：Token 在黑名单中抛出 401")
    void refreshToken_blacklisted() {
        String rt = "blacklisted_token";

        when(jwtUtil.isTokenValid(rt)).thenReturn(true);
        when(jwtUtil.getJtiFromToken(rt)).thenReturn("jti-blacklisted");
        when(tokenBlacklistRepository.existsByJti("jti-blacklisted")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.refreshToken(rt));
        assertEquals(401, ex.getCode());
    }

    @Test
    @DisplayName("刷新 Token 失败：用户不存在抛出 401")
    void refreshToken_userNotFound() {
        String rt = "valid_token";

        when(jwtUtil.isTokenValid(rt)).thenReturn(true);
        when(jwtUtil.getJtiFromToken(rt)).thenReturn("jti-x");
        when(tokenBlacklistRepository.existsByJti("jti-x")).thenReturn(false);
        when(jwtUtil.getUserIdFromToken(rt)).thenReturn(999L);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.refreshToken(rt));
        assertEquals(401, ex.getCode());
    }

    // === 登出测试 ===

    @Test
    @DisplayName("登出成功：Token jti 加入黑名单")
    void logout_success() {
        String at = "valid_access_token";
        Date expDate = new Date(System.currentTimeMillis() + 3600000);

        when(jwtUtil.isTokenValid(at)).thenReturn(true);
        when(jwtUtil.getJtiFromToken(at)).thenReturn("jti-logout");
        when(tokenBlacklistRepository.existsByJti("jti-logout")).thenReturn(false);
        when(jwtUtil.getExpirationFromToken(at)).thenReturn(expDate);

        authService.logout(at, null);

        ArgumentCaptor<TokenBlacklist> captor = ArgumentCaptor.forClass(TokenBlacklist.class);
        verify(tokenBlacklistRepository).save(captor.capture());
        assertEquals("jti-logout", captor.getValue().getJti());
    }

    @Test
    @DisplayName("登出：Token 无效时静默返回，不加入黑名单")
    void logout_invalidToken() {
        when(jwtUtil.isTokenValid("expired")).thenReturn(false);

        authService.logout("expired", null);

        verify(tokenBlacklistRepository, never()).save(any());
    }

    @Test
    @DisplayName("登出：Token 已在黑名单中不重复添加")
    void logout_alreadyBlacklisted() {
        String at = "already_blacklisted";

        when(jwtUtil.isTokenValid(at)).thenReturn(true);
        when(jwtUtil.getJtiFromToken(at)).thenReturn("jti-dup");
        when(tokenBlacklistRepository.existsByJti("jti-dup")).thenReturn(true);

        authService.logout(at, null);

        verify(tokenBlacklistRepository, never()).save(any());
    }
}