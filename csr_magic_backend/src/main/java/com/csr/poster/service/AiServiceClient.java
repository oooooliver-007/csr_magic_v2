package com.csr.poster.service;

import com.csr.activity.entity.Activity;
import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.entity.AiPoster;
import com.csr.poster.repository.AiPosterRepository;
import com.csr.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * AI 服务调用客户端。提取为独立 Component 确保 @Async 能被 Spring AOP 代理拦截。
 */
@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final AiPosterRepository aiPosterRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    @Value("${ai-service.api-token:}")
    private String aiServiceApiToken;

    public AiServiceClient(AiPosterRepository aiPosterRepository,
                           UserRepository userRepository) {
        this.aiPosterRepository = aiPosterRepository;
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
    }

    @Async
    public void callGenerate(String taskId, Activity activity,
                             GeneratePosterRequest request, Long userId) {
        try {
            String userName = userRepository.findById(userId)
                    .map(u -> u.getDisplayName() != null ? u.getDisplayName() : u.getUsername())
                    .orElse(null);

            Map<String, Object> body = Map.of(
                    "task_id", taskId,
                    "activity_name", activity.getName(),
                    "activity_type", activity.getTemplateType().name(),
                    "style", request.style(),
                    "user_prompt", request.userPrompt() != null ? request.userPrompt() : "",
                    "user_name", userName != null ? userName : ""
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (aiServiceApiToken != null && !aiServiceApiToken.isBlank()) {
                headers.set("X-Api-Key", aiServiceApiToken);
            }
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(aiServiceBaseUrl + "/poster/generate", entity, String.class);
            log.info("已发送海报生成请求至 AI 服务: taskId={}", taskId);

        } catch (Exception e) {
            log.error("调用 AI 服务失败: taskId={}, error={}", taskId, e.getMessage());
            aiPosterRepository.findByTaskId(taskId).ifPresent(poster -> {
                poster.setStatus("FAILED");
                poster.setErrorMessage("AI 服务调用失败: " + e.getMessage());
                aiPosterRepository.save(poster);
            });
        }
    }

    public String getAiServiceBaseUrl() {
        return aiServiceBaseUrl;
    }

    public RestTemplate getRestTemplate() {
        return restTemplate;
    }
}
