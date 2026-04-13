package com.csr.user.controller;

import com.csr.common.BusinessException;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.user.dto.UserDetailResponse;
import com.csr.user.dto.UserResponse;
import com.csr.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private static final UserResponse SAMPLE_USER = new UserResponse(
            1L, "testuser", "测试用户", "张三", "MALE", "北京", "USER",
            "2026-04-01T00:00:00Z", null
    );

    private static final UserDetailResponse SAMPLE_DETAIL = new UserDetailResponse(
            1L, "testuser", "测试用户", "张三", "MALE", "北京", "USER",
            "2026-04-01T00:00:00Z", null, 3, List.of()
    );

    // === 列表查询 ===

    @Test
    @DisplayName("GET /users 返回分页列表")
    void list_success() throws Exception {
        Page<UserResponse> page = new PageImpl<>(List.of(SAMPLE_USER));
        when(userService.list(isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/users")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].username").value("testuser"));
    }

    @Test
    @DisplayName("GET /users?keyword=张三 返回筛选结果")
    void list_withKeyword() throws Exception {
        Page<UserResponse> page = new PageImpl<>(List.of(SAMPLE_USER));
        when(userService.list(eq("张三"), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/users")
                        .param("keyword", "张三"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].displayName").value("测试用户"));
    }

    // === 详情查询 ===

    @Test
    @DisplayName("GET /users/{id} 返回用户详情")
    void getById_success() throws Exception {
        when(userService.getById(1L)).thenReturn(SAMPLE_DETAIL);

        mockMvc.perform(get("/api/v2/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.participationCount").value(3));
    }

    @Test
    @DisplayName("GET /users/{id} 不存在返回 404")
    void getById_notFound() throws Exception {
        when(userService.getById(999L)).thenThrow(new BusinessException(404, "用户不存在"));

        mockMvc.perform(get("/api/v2/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // === 更新 ===

    @Test
    @DisplayName("PUT /users/{id} 更新成功")
    void update_success() throws Exception {
        UserResponse updated = new UserResponse(
                1L, "testuser", "新昵称", "张三", "MALE", "北京", "USER",
                "2026-04-01T00:00:00Z", "2026-04-10T00:00:00Z"
        );
        when(userService.update(eq(1L), any())).thenReturn(updated);

        String body = """
                {"displayName":"新昵称"}
                """;

        mockMvc.perform(put("/api/v2/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.displayName").value("新昵称"));
    }

    @Test
    @DisplayName("PUT /users/{id} 不存在返回 404")
    void update_notFound() throws Exception {
        when(userService.update(eq(999L), any())).thenThrow(new BusinessException(404, "用户不存在"));

        String body = """
                {"displayName":"不存在"}
                """;

        mockMvc.perform(put("/api/v2/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // === 删除 ===

    @Test
    @DisplayName("DELETE /users/{id} 删除成功")
    void delete_success() throws Exception {
        doNothing().when(userService).delete(1L);

        mockMvc.perform(delete("/api/v2/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /users/{id} 不存在返回 404")
    void delete_notFound() throws Exception {
        doThrow(new BusinessException(404, "用户不存在")).when(userService).delete(999L);

        mockMvc.perform(delete("/api/v2/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // === 重置密码 ===

    @Test
    @DisplayName("PUT /users/{id}/reset-password 重置成功")
    void resetPassword_success() throws Exception {
        doNothing().when(userService).resetPassword(eq(1L), anyString());

        String body = """
                {"newPassword":"newpass123"}
                """;

        mockMvc.perform(put("/api/v2/users/1/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /users/{id}/reset-password 密码为空返回 400")
    void resetPassword_blankPassword() throws Exception {
        String body = """
                {"newPassword":""}
                """;

        mockMvc.perform(put("/api/v2/users/1/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("PUT /users/{id}/reset-password 密码过短返回 400")
    void resetPassword_tooShort() throws Exception {
        String body = """
                {"newPassword":"12345"}
                """;

        mockMvc.perform(put("/api/v2/users/1/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }
}
