package com.medico.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDoctorResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String specialization;
    private String hospitalName;
}
