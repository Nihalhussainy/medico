package com.medico.backend.dto;

import com.medico.backend.entity.DoctorVerificationStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDoctorVerificationResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String specialization;
    private String licenseNumber;
    private String hospitalName;
    private DoctorVerificationStatus verificationStatus;
    private String verificationNote;
    private Instant verifiedAt;
    private String verifiedByEmail;
    private Instant registeredAt;
}
