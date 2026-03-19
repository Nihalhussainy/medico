package com.medico.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicalRecordResponse {
    private Long id;
    private Long patientId;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String title;
    private String description;
    private String hospitalName;
    private String diagnosis;
    private String vitals;
    private String medications;
    private String allergies;
    private String advice;
    private Integer medicineDuration;
    private Long familyMemberId;
    private String familyMemberFirstName;
    private String familyMemberLastName;
    private String familyMemberRelationship;
    private LocalDate followUpDate;
    private LocalDate recordDate;
    private Instant createdAt;
    private List<MedicalFileResponse> files;
}
