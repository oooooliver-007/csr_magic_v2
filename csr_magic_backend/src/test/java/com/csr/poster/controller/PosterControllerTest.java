package com.csr.poster.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import com.csr.poster.service.PosterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PosterController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PosterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PosterService posterService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private UsernamePasswordAuthenticationToken userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
            1L, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /posters/generate 成功提交生成任务")
    void generate_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        when(posterService.generate(any(), eq(1L))).thenReturn(new GenerateTaskResponse("task123"));

        mockMvc.perform(post("/api/v2/posters/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("activityId", 1, "style", "cartoon"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.taskId").value("task123"));
    }

    @Test
    @DisplayName("POST /posters/generate 缺少 style 返回 400")
    void generate_missingStyle() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());

        mockMvc.perform(post("/api/v2/posters/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("activityId", 1))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /posters/{taskId}/status 返回任务状态")
    void getStatus_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        when(posterService.getStatus("task123", 1L))
            .thenReturn(new PosterStatusResponse("task123", "COMPLETED", "http://img.png", null));

        mockMvc.perform(get("/api/v2/posters/task123/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPLETED"))
            .andExpect(jsonPath("$.data.posterUrl").value("http://img.png"));
    }

    @Test
    @DisplayName("GET /posters/my 返回我的海报分页")
    void getMyPosters_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        PosterResponse poster = new PosterResponse(
            10L, 1L, "春季植树", "task123", "cartoon", null, "COMPLETED",
            "http://img.png", null, "2026-04-15T10:00:00Z", null
        );
        Page<PosterResponse> page = new PageImpl<>(List.of(poster));
        when(posterService.getMyPosters(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/posters/my")
                .param("page", "0").param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].taskId").value("task123"))
            .andExpect(jsonPath("$.data.content[0].style").value("cartoon"))
            .andExpect(jsonPath("$.data.content[0].activityName").value("春季植树"));
    }
}
