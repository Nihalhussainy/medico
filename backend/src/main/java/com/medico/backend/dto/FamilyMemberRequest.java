package com.medico.backend.dto;

import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FamilyMemberRequest {
    private String firstName;
    private String lastName;
    private String relationship;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String phoneNumber;
    private String profilePhotoUrl;
}
