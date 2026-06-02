package com.csr.survey.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.survey.dto.CreateSurveyRequest;
import com.csr.survey.dto.SurveyResponse;
import com.csr.survey.service.SurveyService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SurveyController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SurveyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SurveyService surveyService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private static final SurveyResponse QUESTIONNAIRE = new SurveyResponse(
            1L,
            10L,
            "员工满意度问卷",
            "关于工作满意度的调研",
            "DRAFT",
            List.of(new SurveyResponse.QuestionResponse(
                    101L,
                    "请为团队协作打分",
                    "RATING",
                    List.of(),
                    true,
                    0
            )),
            0,
            "2026-06-01T00:00:00Z",
            null
    );

    @Test
    @DisplayName("GET /surveys 返回分页问卷列表")
    void list_success() throws Exception {
        Page<SurveyResponse> page = new PageImpl<>(List.of(QUESTIONNAIRE));
        when(surveyService.list(isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/surveys").param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].title").value("员工满意度问卷"));
    }

    @Test
    @DisplayName("GET /surveys/{id} 返回问卷详情")
    void getById_success() throws Exception {
        when(surveyService.getById(eq(1L))).thenReturn(QUESTIONNAIRE);

        mockMvc.perform(get("/api/v2/surveys/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").value("员工满意度问卷"));
    }

    @Test
    @DisplayName("POST /surveys 创建问卷成功返回 201")
    void create_success() throws Exception {
        when(surveyService.create(any(CreateSurveyRequest.class))).thenReturn(QUESTIONNAIRE);

        String body = """
                {"activityId":10,"title":"员工满意度问卷","description":"关于工作满意度的调研","questions":[{"questionText":"请为团队协作打分","questionType":"RATING","required":true,"sortOrder":0}]}
                """;

        mockMvc.perform(post("/api/v2/surveys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("员工满意度问卷"))
                .andExpect(jsonPath("$.data.questions[0].questionText").value("请为团队协作打分"));
    }

    @Test
    @DisplayName("POST /surveys 缺少标题返回 400")
    void create_validationFail() throws Exception {
        String body = """
                {"activityId":10,"title":"","questions":[{"questionText":"Q1","questionType":"TEXT"}]}
                """;

        mockMvc.perform(post("/api/v2/surveys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("PATCH /surveys/{id}/status 更新状态成功")
    void updateStatus_success() throws Exception {
        SurveyResponse published = new SurveyResponse(
                1L,
                10L,
                "员工满意度问卷",
                "关于工作满意度的调研",
                "PUBLISHED",
                QUESTIONNAIRE.questions(),
                0,
                QUESTIONNAIRE.createdAt(),
                "2026-06-02T00:00:00Z"
        );
        when(surveyService.updateStatus(eq(1L), eq("PUBLISHED"))).thenReturn(published);

        String body = """
                {"status":"PUBLISHED"}
                """;

        mockMvc.perform(patch("/api/v2/surveys/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }
}
