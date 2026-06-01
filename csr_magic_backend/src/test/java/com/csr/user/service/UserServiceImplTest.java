package com.csr.user.service;

import com.csr.audit.service.AuditLogService;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.user.dto.MyStatsResponse;
import com.csr.user.dto.UpdateMeRequest;
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
    private AuditLogService auditLogService;

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
        when(userRepository.findByFilters(eq(""), eq(""), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list(null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("测试用户", result.getContent().get(0).displayName());
        verify(userRepository).findByFilters(eq(""), eq(""), eq(pageable));
    }

    @Test
    @DisplayName("获取用户列表：按关键字筛选")
    void list_withKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findByFilters(eq("张三"), eq(""), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list("张三", null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("获取用户列表：按地区筛选")
    void list_withRegion() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findByFilters(eq(""), eq("北京"), eq(pageable))).thenReturn(page);

        Page<UserResponse> result = userService.list(null, "北京", pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("获取用户列表：空白关键字等同无关键字")
    void list_blankKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(), pageable, 0);
        when(userRepository.findByFilters(eq(""), eq(""), eq(pageable))).thenReturn(page);

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

    // === getMe 测试 ===

    @Test
    @DisplayName("getMe：成功返回当前用户信息")
    void getMe_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse response = userService.getMe(1L);

        assertEquals(1L, response.id());
        assertEquals("testuser", response.username());
        assertEquals("测试用户", response.displayName());
    }

    @Test
    @DisplayName("getMe：用户不存在抛出 BusinessException 404")
    void getMe_notFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.getMe(999L));
        assertEquals(404, ex.getCode());
    }

    // === updateMe 测试 ===

    @Test
    @DisplayName("updateMe：成功更新昵称和真名")
    void updateMe_success() {
        UpdateMeRequest request = new UpdateMeRequest("新昵称", "李四", null, null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.updateMe(1L, request);

        assertNotNull(response);
        assertEquals("新昵称", testUser.getDisplayName());
        assertEquals("李四", testUser.getRealName());
        assertEquals("MALE", testUser.getGender()); // 未修改
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateMe：仅更新非null字段")
    void updateMe_partialUpdate() {
        UpdateMeRequest request = new UpdateMeRequest(null, null, "FEMALE", "上海");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.updateMe(1L, request);

        assertEquals("测试用户", testUser.getDisplayName()); // 未修改
        assertEquals("FEMALE", testUser.getGender());
        assertEquals("上海", testUser.getRegion());
    }

    @Test
    @DisplayName("updateMe：用户不存在抛出 BusinessException 404")
    void updateMe_notFound() {
        UpdateMeRequest request = new UpdateMeRequest("test", null, null, null);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> userService.updateMe(999L, request));
    }

    // === changePassword 测试 ===

    @Test
    @DisplayName("changePassword：当前密码正确时成功修改")
    void changePassword_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldpass", "encoded_password")).thenReturn(true);
        when(passwordEncoder.encode("newpass123")).thenReturn("encoded_newpass");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changePassword(1L, "oldpass", "newpass123");

        assertEquals("encoded_newpass", testUser.getPassword());
        verify(passwordEncoder).matches("oldpass", "encoded_password");
        verify(passwordEncoder).encode("newpass123");
    }

    @Test
    @DisplayName("changePassword：当前密码错误时抛出 BusinessException 400")
    void changePassword_wrongCurrentPassword() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", "encoded_password")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.changePassword(1L, "wrongpass", "newpass123"));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("当前密码不正确"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword：用户不存在抛出 BusinessException 404")
    void changePassword_notFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class,
                () -> userService.changePassword(999L, "old", "new"));
    }

    // === getMyStats 测试 ===

    @Test
    @DisplayName("getMyStats：返回正确的贡献统计数据")
    void getMyStats_success() {
        when(userActivityRepository.countByUserId(1L)).thenReturn(5L);
        when(userActivityRepository.sumVolunteerHoursByUserId(1L)).thenReturn(24.5);
        when(userActivityRepository.sumDonationByUserId(1L)).thenReturn(350.0);

        MyStatsResponse stats = userService.getMyStats(1L);

        assertEquals(5L, stats.activityCount());
        assertEquals(24.5, stats.volunteerHours());
        assertEquals(350.0, stats.totalDonation());
    }

    @Test
    @DisplayName("getMyStats：无参与记录时返回零值")
    void getMyStats_noRecords() {
        when(userActivityRepository.countByUserId(2L)).thenReturn(0L);
        when(userActivityRepository.sumVolunteerHoursByUserId(2L)).thenReturn(0.0);
        when(userActivityRepository.sumDonationByUserId(2L)).thenReturn(0.0);

        MyStatsResponse stats = userService.getMyStats(2L);

        assertEquals(0L, stats.activityCount());
        assertEquals(0.0, stats.volunteerHours());
        assertEquals(0.0, stats.totalDonation());
    }
}