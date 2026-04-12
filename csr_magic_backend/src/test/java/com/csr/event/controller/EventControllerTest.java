package com.csr.event.controller;

import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.event.dto.EventResponse;
import com.csr.event.exception.EventNotFoundException;
import com.csr.event.service.EventService;
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

@WebMvcTest(EventController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private static final EventResponse SAMPLE_EVENT = new EventResponse(
        1L, "2026春季CSR月", "春季活动", "OFFLINE",
        "2026-04-01T00:00:00Z", "2026-04-30T00:00:00Z",
        null, true,
        "2026-03-15T00:00:00Z", null
    );

    // === CRUD 功能测试 ===

    @Test
    @DisplayName("GET /events 返回分页列表")
    void list_success() throws Exception {
        Page<EventResponse> page = new PageImpl<>(List.of(SAMPLE_EVENT));
        when(eventService.list(isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/events")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].name").value("2026春季CSR月"));
    }

    @Test
    @DisplayName("GET /events?keyword=春季 返回筛选结果")
    void list_withKeyword() throws Exception {
        Page<EventResponse> page = new PageImpl<>(List.of(SAMPLE_EVENT));
        when(eventService.list(eq("春季"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/events")
                        .param("keyword", "春季"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("2026春季CSR月"));
    }

    @Test
    @DisplayName("GET /events/{id} 返回事件详情")
    void getById_success() throws Exception {
        when(eventService.getById(1L)).thenReturn(SAMPLE_EVENT);

        mockMvc.perform(get("/api/v2/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("2026春季CSR月"));
    }

    @Test
    @DisplayName("GET /events/{id} 不存在返回 404")
    void getById_notFound() throws Exception {
        when(eventService.getById(999L)).thenThrow(new EventNotFoundException(999L));

        mockMvc.perform(get("/api/v2/events/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("POST /events 创建事件成功返回 201")
    void create_success() throws Exception {
        when(eventService.create(any())).thenReturn(SAMPLE_EVENT);

        String body = """
                {"name":"2026春季CSR月","type":"OFFLINE","startDate":"2026-04-01T00:00:00Z","endDate":"2026-04-30T00:00:00Z"}
                """;

        mockMvc.perform(post("/api/v2/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("2026春季CSR月"));
    }

    @Test
    @DisplayName("POST /events 缺少名称返回 400")
    void create_validationFail() throws Exception {
        String body = """
                {"name":"","type":"OFFLINE"}
                """;

        mockMvc.perform(post("/api/v2/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("PUT /events/{id} 更新事件成功")
    void update_success() throws Exception {
        EventResponse updated = new EventResponse(
            1L, "更新后", "春季活动", "OFFLINE",
            "2026-04-01T00:00:00Z", "2026-04-30T00:00:00Z",
            null, true,
            "2026-03-15T00:00:00Z", "2026-04-01T00:00:00Z"
        );
        when(eventService.update(eq(1L), any())).thenReturn(updated);

        String body = """
                {"name":"更新后"}
                """;

        mockMvc.perform(put("/api/v2/events/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("更新后"));
    }

    @Test
    @DisplayName("PUT /events/{id} 不存在返回 404")
    void update_notFound() throws Exception {
        when(eventService.update(eq(999L), any())).thenThrow(new EventNotFoundException(999L));

        String body = """
                {"name":"不存在的事件"}
                """;

        mockMvc.perform(put("/api/v2/events/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("DELETE /events/{id} 删除成功")
    void delete_success() throws Exception {
        doNothing().when(eventService).delete(1L);

        mockMvc.perform(delete("/api/v2/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /events/{id} 不存在返回 404")
    void delete_notFound() throws Exception {
        doThrow(new EventNotFoundException(999L)).when(eventService).delete(999L);

        mockMvc.perform(delete("/api/v2/events/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }
}
