package com.medico.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicalRecordUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String hospitalName;

    private String diagnosis;

    private String vitals;

    private String medications;

    private String allergies;

    private LocalDate followUpDate;

    private LocalDate recordDate;
}
