package com.medico.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LabReportItemResponse {
    private String sourceType;
    private Long id;
    private Long linkedRecordId;
    private String url;
    private String fileType;
    private String originalFileName;
    private String uploadedByRole;
    private String uploadedByName;
    private Instant createdAt;
    private LocalDate recordDate;
    private String diagnosis;
    private String doctorName;
    private Long familyMemberId;
    private String familyMemberFirstName;
    private String familyMemberLastName;
    private String familyMemberRelationship;
}
