package com.csr.poster.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.repository.ActivityRepository;
import com.csr.common.BusinessException;
import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import com.csr.poster.entity.AiPoster;
import com.csr.poster.repository.AiPosterRepository;
import com.csr.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PosterServiceImpl implements PosterService {

    private static final Logger log = LoggerFactory.getLogger(PosterServiceImpl.class);

    private final AiPosterRepository aiPosterRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final RestTemplate restTemplate;

    @Value("${ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public PosterServiceImpl(
            AiPosterRepository aiPosterRepository,
            ActivityRepository activityRepository,
            UserRepository userRepository,
            AiServiceClient aiServiceClient) {
        this.aiPosterRepository = aiPosterRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
        this.restTemplate = new RestTemplate();
    }

    /**
     * 定时轮询 AI 服务，同步 PENDING / GENERATING 任务的最新状态。
     * 每 15 秒执行一次。AI 服务重启导致状态丢失时，此轮询确保客户端不永久卡住。
     */
    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void scheduledStatusSync() {
        List<AiPoster> pendingTasks = aiPosterRepository.findByStatusIn(
                List.of("PENDING", "GENERATING"));

        if (pendingTasks.isEmpty()) {
            return;
        }

        log.debug("定时轮询：发现 {} 个待同步的海报任务", pendingTasks.size());
        for (AiPoster poster : pendingTasks) {
            try {
                syncStatusFromAiService(poster);
            } catch (Exception e) {
                log.warn("定时轮询同步失败: taskId={}, error={}",
                        poster.getTaskId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public GenerateTaskResponse generate(GeneratePosterRequest request, Long userId) {
        Activity activity = activityRepository.findById(request.activityId())
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        String taskId = UUID.randomUUID().toString().replace("-", "");

        AiPoster poster = new AiPoster();
        poster.setUserId(userId);
        poster.setActivityId(request.activityId());
        poster.setTaskId(taskId);
        poster.setStyle(request.style());
        poster.setUserPrompt(request.userPrompt());
        poster.setStatus("PENDING");

        aiPosterRepository.save(poster);
        log.info("创建海报生成任务: taskId={}, userId={}, activityId={}", taskId, userId, request.activityId());

        // 异步调用 AI 服务
        aiServiceClient.callGenerate(taskId, activity, request, userId);

        return new GenerateTaskResponse(taskId);
    }

    @Override
    @Transactional
    public PosterStatusResponse getStatus(String taskId, Long userId) {
        AiPoster poster = aiPosterRepository.findByTaskId(taskId)
                .orElseThrow(() -> new BusinessException(404, "任务不存在"));

        if (!poster.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权查看此任务");
        }

        // 如果状态为 PENDING 或 GENERATING，尝试从 AI 服务获取最新状态
        if ("PENDING".equals(poster.getStatus()) || "GENERATING".equals(poster.getStatus())) {
            try {
                syncStatusFromAiService(poster);
            } catch (Exception e) {
                log.warn("从 AI 服务同步状态失败: taskId={}, error={}", taskId, e.getMessage());
            }
        }

        return new PosterStatusResponse(
                poster.getTaskId(),
                poster.getStatus(),
                poster.getPosterUrl(),
                poster.getErrorMessage()
        );
    }

    @Override
    public Page<PosterResponse> getMyPosters(Long userId, Pageable pageable) {
        return aiPosterRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(poster -> {
                    String activityName = activityRepository.findById(poster.getActivityId())
                            .map(Activity::getName)
                            .orElse(null);
                    return PosterResponse.from(poster, activityName);
                });
    }

    @Transactional
    public void syncStatusFromAiService(AiPoster poster) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    aiServiceBaseUrl + "/poster/" + poster.getTaskId(), Map.class);

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                String status = (String) data.get("status");
                String posterUrl = (String) data.get("poster_url");
                String errorMessage = (String) data.get("error_message");

                if (posterUrl != null && !posterUrl.isEmpty()) {
                    // 转换为完整 URL
                    posterUrl = aiServiceBaseUrl + posterUrl;
                }

                if (!poster.getStatus().equals(status)) {
                    poster.setStatus(status);
                    poster.setPosterUrl(posterUrl);
                    poster.setErrorMessage(errorMessage);

                    // COMPLETED 且无 posterData 时，从 AI 服务下载图片存入 DB
                    if ("COMPLETED".equals(status) && poster.getPosterData() == null) {
                        try {
                            byte[] imageBytes = restTemplate.getForObject(
                                    aiServiceBaseUrl + "/poster/" + poster.getTaskId() + "/image",
                                    byte[].class);
                            if (imageBytes != null && imageBytes.length > 0) {
                                poster.setPosterData(imageBytes);
                                // 将 URL 替换为后端端点，前端直接访问后端
                                poster.setPosterUrl("/api/v2/posters/" + poster.getTaskId() + "/image");
                                log.info("海报图片已存入 DB: taskId={}, size={} bytes",
                                        poster.getTaskId(), imageBytes.length);
                            }
                        } catch (Exception e) {
                            log.warn("下载海报图片失败: taskId={}, error={}",
                                    poster.getTaskId(), e.getMessage());
                        }
                    }

                    aiPosterRepository.save(poster);
                    log.info("同步海报状态: taskId={}, status={}", poster.getTaskId(), status);
                }
            }
        } catch (Exception e) {
            log.warn("同步 AI 服务状态失败: {}", e.getMessage());
        }
    }

    @Override
    public byte[] getPosterImage(String taskId, Long userId) {
        AiPoster poster = aiPosterRepository.findByTaskId(taskId)
                .orElse(null);
        if (poster == null || !poster.getUserId().equals(userId)) {
            return null;
        }
        return poster.getPosterData();
    }

    @Override
    public byte[] getPosterImageByTaskId(String taskId) {
        AiPoster poster = aiPosterRepository.findByTaskId(taskId)
                .orElse(null);
        if (poster == null) {
            return null;
        }
        return poster.getPosterData();
    }

    @Transactional
    public void updatePosterStatus(String taskId, String status, String posterUrl, String errorMessage) {
        aiPosterRepository.findByTaskId(taskId).ifPresent(poster -> {
            poster.setStatus(status);
            poster.setPosterUrl(posterUrl);
            poster.setErrorMessage(errorMessage);
            aiPosterRepository.save(poster);
        });
    }
}
