package com.csr.chat.service;

import com.csr.chat.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * 定时任务：清理 24 小时未更新的陈旧 chat_session 记录，防止会话索引无限增长。
 */
@Component
public class ChatSessionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(ChatSessionCleanupJob.class);
    private static final long SESSION_TTL_HOURS = 24;

    private final ChatSessionRepository chatSessionRepository;

    public ChatSessionCleanupJob(ChatSessionRepository chatSessionRepository) {
        this.chatSessionRepository = chatSessionRepository;
    }

    @Transactional
    @Scheduled(fixedDelay = 60 * 60 * 1000L)
    public void cleanup() {
        Instant threshold = Instant.now().minus(SESSION_TTL_HOURS, ChronoUnit.HOURS);
        int removed = chatSessionRepository.deleteStaleSessions(threshold);
        if (removed > 0) {
            log.info("清理 {} 个陈旧 chat_session（阈值 {}）", removed, threshold);
        }
    }
}
