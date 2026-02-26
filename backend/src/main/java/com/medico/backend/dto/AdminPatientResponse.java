package com.medico.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminPatientResponse {
    private Long id;
    private String fullName;
    private Integer age;
    private String gender;
    private String phoneNumber;
    private String bloodGroup;
    private String location;
}
