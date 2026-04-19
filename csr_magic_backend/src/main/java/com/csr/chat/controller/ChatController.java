package com.csr.chat.controller;

import com.csr.chat.dto.ChatConfirmRequest;
import com.csr.chat.dto.ChatMessageRequest;
import com.csr.chat.dto.ChatResponse;
import com.csr.chat.dto.ChatStartRequest;
import com.csr.chat.service.ChatService;
import com.csr.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 对话报名 Controller — 前端与 csr_ai_service 之间的网关。
 */
@RestController
@RequestMapping("/api/v2/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatResponse> start(@Valid @RequestBody ChatStartRequest request) {
        return ApiResponse.success(chatService.start(request.activityId(), getCurrentUserId()));
    }

    @PostMapping("/message")
    public ApiResponse<ChatResponse> message(@Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success(chatService.sendMessage(
            request.sessionId(), request.content(), getCurrentUserId()));
    }

    @PostMapping("/confirm")
    public ApiResponse<ChatResponse> confirm(@Valid @RequestBody ChatConfirmRequest request) {
        return ApiResponse.success(chatService.confirm(request.sessionId(), getCurrentUserId()));
    }

    @GetMapping("/sessions/{sessionId}")
    public ApiResponse<ChatResponse> getSession(@PathVariable String sessionId) {
        return ApiResponse.success(chatService.get(sessionId, getCurrentUserId()));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
