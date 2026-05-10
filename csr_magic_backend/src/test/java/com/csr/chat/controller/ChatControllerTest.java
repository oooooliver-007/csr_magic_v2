package com.csr.chat.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.chat.dto.ChatResponse;
import com.csr.chat.service.ChatService;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
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

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ChatService chatService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private UsernamePasswordAuthenticationToken userAuth() {
        return new UsernamePasswordAuthenticationToken(
            1L, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /chat/start 成功创建会话")
    void start_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuth());
        ChatResponse response = ChatResponse.of("sess-1", 10L, "你好", "COLLECTING",
            Map.of(), false, List.of());
        when(chatService.start(eq(10L), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v2/chat/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("activityId", 10))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.sessionId").value("sess-1"))
            .andExpect(jsonPath("$.data.status").value("COLLECTING"));
    }

    @Test
    @DisplayName("POST /chat/start 缺少 activityId 返回 400")
    void start_missingActivityId() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuth());
        mockMvc.perform(post("/api/v2/chat/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /chat/message 转发消息")
    void message_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuth());
        ChatResponse response = ChatResponse.of("sess-1", 10L, "好的", "COLLECTING",
            Map.of("amount", 200), false, List.of());
        when(chatService.sendMessage(eq("sess-1"), eq("捐 200"), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v2/chat/message")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("sessionId", "sess-1", "content", "捐 200"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.collectedFields.amount").value(200));
    }

    @Test
    @DisplayName("POST /chat/confirm 触发报名并返回 participationId")
    void confirm_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuth());
        ChatResponse response = ChatResponse.of("sess-1", 10L, "已提交", "COMPLETED",
            Map.of("amount", 200), true, List.of()).withParticipationId(55L);
        when(chatService.confirm(eq("sess-1"), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v2/chat/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("sessionId", "sess-1"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPLETED"))
            .andExpect(jsonPath("$.data.participationId").value(55));
    }

    @Test
    @DisplayName("GET /chat/sessions/{id} 返回会话状态")
    void getSession_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuth());
        ChatResponse response = ChatResponse.of("sess-1", 10L, "当前状态", "CONFIRMING",
            Map.of("amount", 200), true, List.of());
        when(chatService.get(eq("sess-1"), eq(1L))).thenReturn(response);

        mockMvc.perform(get("/api/v2/chat/sessions/sess-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMING"));
    }
}
