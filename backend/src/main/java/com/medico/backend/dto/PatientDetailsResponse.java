package com.medico.backend.dto;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PatientDetailsResponse {
    private String fullName;
    private Integer age;
    private String gender;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    private String location;
    private String email;
    private String profilePictureUrl;
}