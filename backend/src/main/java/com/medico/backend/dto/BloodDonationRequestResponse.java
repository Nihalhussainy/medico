package com.medico.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BloodDonationRequestResponse {
    private Long id;
    private String bloodGroup;
    private String hospitalName;
    private String patientName;
    private String patientGender;
    private Integer patientAge;
    private String contactNumber;
    private String urgency;
    private String reason;
    private Instant createdAt;
    private Instant expiresAt;
    private Boolean isActive;
    private Integer interestedCount;
}
