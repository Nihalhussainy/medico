package com.medico.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorProfileUpdateRequest {
    @NotBlank
    private String specialization;
    
    private String hospitalName;
}
