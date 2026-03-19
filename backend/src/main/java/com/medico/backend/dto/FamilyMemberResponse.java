package com.medico.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FamilyMemberResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String relationship;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String phoneNumber;
    private String profilePhotoUrl;
    private Boolean isActive;
    private Instant createdAt;
}
