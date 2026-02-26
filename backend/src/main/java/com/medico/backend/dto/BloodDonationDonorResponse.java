package com.medico.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BloodDonationDonorResponse {
    private Long patientId;
    private String fullName;
    private String phoneNumber;
    private Integer age;
    private String gender;
    private String bloodGroup;
    private String location;
}
