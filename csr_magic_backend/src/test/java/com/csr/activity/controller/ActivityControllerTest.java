package com.csr.activity.controller;

import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.service.ActivityService;
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

@WebMvcTest(ActivityController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ActivityService activityService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private static final ActivityResponse SAMPLE_ACTIVITY = new ActivityResponse(
        1L, 1L, "2026春季CSR月", "春季植树活动", "参与植树造林",
        "VOLUNTEER", "2026-04-15T00:00:00Z", "2026-04-16T00:00:00Z",
        50, null, "UPCOMING", null, 0L,
        "2026-04-01T00:00:00Z", null
    );

    // === 列表查询 ===

    @Test
    @DisplayName("GET /activities 返回分页列表")
    void list_success() throws Exception {
        Page<ActivityResponse> page = new PageImpl<>(List.of(SAMPLE_ACTIVITY));
        when(activityService.list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/activities")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].name").value("春季植树活动"));
    }

    @Test
    @DisplayName("GET /activities?eventId=1&status=UPCOMING 返回筛选结果")
    void list_withFilters() throws Exception {
        Page<ActivityResponse> page = new PageImpl<>(List.of(SAMPLE_ACTIVITY));
        when(activityService.list(eq(1L), eq("UPCOMING"), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/activities")
                        .param("eventId", "1")
                        .param("status", "UPCOMING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].eventId").value(1));
    }

    @Test
    @DisplayName("GET /activities?keyword=植树 返回搜索结果")
    void list_withKeyword() throws Exception {
        Page<ActivityResponse> page = new PageImpl<>(List.of(SAMPLE_ACTIVITY));
        when(activityService.list(isNull(), isNull(), isNull(), eq("植树"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/activities")
                        .param("keyword", "植树"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("春季植树活动"));
    }

    // === 详情查询 ===

    @Test
    @DisplayName("GET /activities/{id} 返回活动详情")
    void getById_success() throws Exception {
        when(activityService.getById(1L)).thenReturn(SAMPLE_ACTIVITY);

        mockMvc.perform(get("/api/v2/activities/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("春季植树活动"))
                .andExpect(jsonPath("$.data.templateType").value("VOLUNTEER"));
    }

    @Test
    @DisplayName("GET /activities/{id} 不存在返回 404")
    void getById_notFound() throws Exception {
        when(activityService.getById(999L)).thenThrow(new ActivityNotFoundException(999L));

        mockMvc.perform(get("/api/v2/activities/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // === 创建 ===

    @Test
    @DisplayName("POST /activities 创建活动成功返回 201")
    void create_success() throws Exception {
        when(activityService.create(any())).thenReturn(SAMPLE_ACTIVITY);

        String body = """
                {"eventId":1,"name":"春季植树活动","templateType":"VOLUNTEER","startTime":"2026-04-15T00:00:00Z","endTime":"2026-04-16T00:00:00Z","maxParticipants":50}
                """;

        mockMvc.perform(post("/api/v2/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("春季植树活动"));
    }

    @Test
    @DisplayName("POST /activities 缺少必填字段返回 400")
    void create_validationFail_missingName() throws Exception {
        String body = """
                {"eventId":1,"name":"","templateType":"VOLUNTEER"}
                """;

        mockMvc.perform(post("/api/v2/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /activities 缺少 templateType 返回 400")
    void create_validationFail_missingTemplateType() throws Exception {
        String body = """
                {"eventId":1,"name":"测试活动"}
                """;

        mockMvc.perform(post("/api/v2/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    // === 更新 ===

    @Test
    @DisplayName("PUT /activities/{id} 更新活动成功")
    void update_success() throws Exception {
        ActivityResponse updated = new ActivityResponse(
            1L, 1L, "2026春季CSR月", "更新后的活动", "参与植树造林",
            "VOLUNTEER", "2026-04-15T00:00:00Z", "2026-04-16T00:00:00Z",
            50, null, "ONGOING", null, 0L,
            "2026-04-01T00:00:00Z", "2026-04-10T00:00:00Z"
        );
        when(activityService.update(eq(1L), any())).thenReturn(updated);

        String body = """
                {"name":"更新后的活动","status":"ONGOING"}
                """;

        mockMvc.perform(put("/api/v2/activities/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("更新后的活动"))
                .andExpect(jsonPath("$.data.status").value("ONGOING"));
    }

    @Test
    @DisplayName("PUT /activities/{id} 不存在返回 404")
    void update_notFound() throws Exception {
        when(activityService.update(eq(999L), any())).thenThrow(new ActivityNotFoundException(999L));

        String body = """
                {"name":"不存在的活动"}
                """;

        mockMvc.perform(put("/api/v2/activities/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // === 删除 ===

    @Test
    @DisplayName("DELETE /activities/{id} 删除成功")
    void delete_success() throws Exception {
        doNothing().when(activityService).delete(1L);

        mockMvc.perform(delete("/api/v2/activities/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /activities/{id} 不存在返回 404")
    void delete_notFound() throws Exception {
        doThrow(new ActivityNotFoundException(999L)).when(activityService).delete(999L);

        mockMvc.perform(delete("/api/v2/activities/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }
}
