package com.csr.participation.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.participation.dto.ParticipationResponse;
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

    private UsernamePasswordAuthenticationToken adminAuthentication() {
        return new UsernamePasswordAuthenticationToken(
            1L,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
