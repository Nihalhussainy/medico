package com.medico.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodDonationRequestCreateRequest {
    private String bloodGroup; // O+, O-, A+, A-, B+, B-, AB+, AB-
    private String hospitalName;
    private String patientName;
    private String patientGender;
    private Integer patientAge;
    private String contactNumber;
    private String urgency; // CRITICAL, HIGH, NORMAL
    private String reason; // Optional
}
