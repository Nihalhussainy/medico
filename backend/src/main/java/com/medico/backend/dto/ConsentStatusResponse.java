package com.medico.backend.dto;

import com.medico.backend.entity.ConsentStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ConsentStatusResponse {
    private ConsentStatus status;
    private Instant expiresAt;
    private Instant consentValidUntil;
    private String otp;
}
