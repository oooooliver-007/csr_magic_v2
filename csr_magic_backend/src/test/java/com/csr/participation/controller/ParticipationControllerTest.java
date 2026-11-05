package com.csr.participation.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.service.ParticipationExportService;
import com.csr.participation.service.ParticipationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ParticipationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ParticipationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ParticipationService participationService;

    @MockitoBean
    private ParticipationExportService participationExportService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Test
    @DisplayName("GET /participations/review-todos 返回待审核报名分页")
    void getReviewTodos_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        ParticipationResponse todo = new ParticipationResponse(
            1L,
            2L,
            "lisi",
            "李四",
            3L,
            "春季植树活动",
            "PENDING",
            null,
            null,
            null,
            null,
            null,
            "2026-04-14T10:00:00Z",
            null,
            List.of()
        );
        Page<ParticipationResponse> page = new PageImpl<>(List.of(todo));
        when(participationService.getReviewTodos(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/participations/review-todos")
                .param("page", "0")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.content[0].state").value("PENDING"))
            .andExpect(jsonPath("$.data.content[0].userDisplayName").value("李四"));
    }

    @Test
    @DisplayName("GET /participations/export 返回 xlsx 附件、导出条数并带下载文件名")
    void exportParticipants_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        byte[] xlsx = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(participationExportService.exportParticipants(3L)).thenReturn(
            new ParticipationExportService.ExportFile("参与人员信息_春季植树活动_20261105.xlsx", xlsx, 2));

        mockMvc.perform(get("/api/v2/participations/export").param("activityId", "3"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .andExpect(header().string("X-Export-Count", "2"))
            .andExpect(header().string("Content-Disposition",
                org.hamcrest.Matchers.allOf(
                    org.hamcrest.Matchers.containsString("attachment"),
                    org.hamcrest.Matchers.containsString("filename*=UTF-8''"))))
            .andExpect(content().bytes(xlsx));
    }

    private UsernamePasswordAuthenticationToken adminAuthentication() {
        return new UsernamePasswordAuthenticationToken(
            1L,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
