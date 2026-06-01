package com.csr.audit.service;

import com.csr.audit.entity.AuditLog;
import com.csr.audit.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 审计日志服务 — 使用 REQUIRES_NEW 确保审计记录不被业务事务回滚影响。
 * operatorId 为 null 时自动从 SecurityContext 获取当前认证用户 ID。
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * 记录一条审计日志。使用独立事务确保即使业务操作失败回滚，审计记录仍然保留。
     *
     * @param operatorId 操作人 ID，null 时自动从 SecurityContext 获取
     * @param action     操作类型 (CREATE/UPDATE/DELETE/REVIEW)
     * @param targetType 目标类型 (EVENT/ACTIVITY/PARTICIPATION/USER)
     * @param targetId   目标 ID
     * @param detail     操作详情
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long operatorId, String action, String targetType, Long targetId, String detail) {
        try {
            Long effectiveOperatorId = operatorId != null ? operatorId : getCurrentUserId();
            AuditLog auditLog = new AuditLog(effectiveOperatorId, action, targetType, targetId, detail);
            auditLogRepository.save(auditLog);
            log.debug("审计日志: operator={}, action={}, target={}.{}",
                    effectiveOperatorId, action, targetType, targetId);
        } catch (Exception e) {
            log.error("审计日志写入失败: {}", e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userId;
        }
        return 0L; // 系统操作或无认证时的兜底值
    }
}
