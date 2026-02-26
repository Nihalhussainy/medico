package com.medico.backend.service;

import com.medico.backend.entity.AuditAction;
import com.medico.backend.entity.AuditLog;
import com.medico.backend.entity.User;
import com.medico.backend.repository.AuditLogRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User user, AuditAction action, String entityType, String entityId, String ipAddress, String details) {
        AuditLog log = AuditLog.builder()
            .user(user)
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .ipAddress(ipAddress)
            .details(details)
            .createdAt(Instant.now())
            .build();
        auditLogRepository.save(log);
    }
}
