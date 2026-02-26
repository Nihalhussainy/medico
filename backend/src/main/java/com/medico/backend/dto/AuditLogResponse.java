package com.medico.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuditLogResponse {
    private Long id;
    private String userEmail;
    private String userRole;
    private String action;
    private String entityType;
    private String entityId;
    private Instant createdAt;
    private String ipAddress;
    private String details;
}
