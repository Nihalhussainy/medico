package com.medico.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BloodDonationNotificationResponse {
    private Long id;
    private Long requestId;
    private String bloodGroup;
    private String hospitalName;
    private String patientName;
    private String patientGender;
    private Integer patientAge;
    private String contactNumber;
    private String urgency;
    private String reason;
    private Boolean isSeen;
    private String response; // INTERESTED, NOT_INTERESTED, NO_RESPONSE
    private Instant createdAt;
}
