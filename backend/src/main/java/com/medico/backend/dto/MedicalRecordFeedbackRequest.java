package com.medico.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicalRecordFeedbackRequest {
    @NotBlank
    private String outcome;
}
