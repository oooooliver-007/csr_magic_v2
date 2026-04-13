package com.csr.user.service;

import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.user.dto.UpdateUserRequest;
import com.csr.user.dto.UserDetailResponse;
import com.csr.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encoded_password");
        testUser.setDisplayName("测试用户");
        testUser.setRealName("张三");
        testUser.setGender("MALE");
        testUser.setRegion("北京");
        testUser.setRole("USER");
        ReflectionTestUtils.setField(testUser, "createdAt", Instant.parse("2026-04-01T00:00:00Z"));
    }

    // === 列表查询测试 ===

    @Test
    @DisplayName("获取用户列表：无筛选条件返回全部分页")
    void list_noFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findByFilters(isNull(), isNull(), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list(null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("测试用户", result.getContent().get(0).displayName());
        verify(userRepository).findByFilters(isNull(), isNull(), eq(pageable));
    }

    @Test
    @DisplayName("获取用户列表：按关键字筛选")
    void list_withKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findByFilters(eq("张三"), isNull(), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list("张三", null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("获取用户列表：按地区筛选")
    void list_withRegion() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findByFilters(isNull(), eq("北京"), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list(null, "北京", pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("获取用户列表：空白关键字等同无关键字")
    void list_blankKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(), pageable, 0);
        when(userRepository.findByFilters(isNull(), isNull(), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list("   ", "  ", pageable);

        assertEquals(0, result.getTotalElements());
    }

    // === 详情查询测试 ===

    @Test
    @DisplayName("获取用户详情：存在时返回含参与统计")
    void getById_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userActivityRepository.countByUserId(1L)).thenReturn(3L);
        when(userActivityRepository.findTop5ByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        UserDetailResponse response = userService.getById(1L);

        assertEquals(1L, response.id());
        assertEquals("测试用户", response.displayName());
        assertEquals(3, response.participationCount());
        assertTrue(response.recentParticipations().isEmpty());
    }

    @Test
    @DisplayName("获取用户详情：不存在时抛出 BusinessException 404")
    void getById_notFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.getById(999L));
        assertEquals(404, ex.getCode());
    }

    // === 更新测试 ===

    @Test
    @DisplayName("更新用户：部分字段更新成功")
    void update_success() {
        UpdateUserRequest request = new UpdateUserRequest("新昵称", null, null, null, null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.update(1L, request);

        assertNotNull(response);
        assertEquals("新昵称", testUser.getDisplayName());
        assertEquals("张三", testUser.getRealName()); // 未修改
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("更新用户：角色切换为 ADMIN 成功")
    void update_roleToAdmin() {
        UpdateUserRequest request = new UpdateUserRequest(null, null, null, null, "ADMIN");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.update(1L, request);

        assertEquals("ADMIN", testUser.getRole());
    }

    @Test
    @DisplayName("更新用户：无效角色值抛出 BusinessException 400")
    void update_invalidRole() {
        UpdateUserRequest request = new UpdateUserRequest(null, null, null, null, "SUPERADMIN");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.update(1L, request));
        assertEquals(400, ex.getCode());
    }

    @Test
    @DisplayName("更新用户：不存在时抛出 BusinessException 404")
    void update_notFound() {
        UpdateUserRequest request = new UpdateUserRequest("test", null, null, null, null);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> userService.update(999L, request));
    }

    // === 删除测试 ===

    @Test
    @DisplayName("删除用户：存在时成功删除")
    void delete_success() {
        when(userRepository.existsById(1L)).thenReturn(true);

        userService.delete(1L);

        verify(userRepository).deleteById(1L);
    }

    @Test
    @DisplayName("删除用户：不存在时抛出 BusinessException 404")
    void delete_notFound() {
        when(userRepository.existsById(999L)).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.delete(999L));
        assertEquals(404, ex.getCode());
        verify(userRepository, never()).deleteById(anyLong());
    }

    // === 重置密码测试 ===

    @Test
    @DisplayName("重置密码：成功加密并保存")
    void resetPassword_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newpass123")).thenReturn("encoded_newpass");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.resetPassword(1L, "newpass123");

        assertEquals("encoded_newpass", testUser.getPassword());
        verify(passwordEncoder).encode("newpass123");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("重置密码：用户不存在时抛出 BusinessException 404")
    void resetPassword_notFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class,
                () -> userService.resetPassword(999L, "newpass"));
    }
}
