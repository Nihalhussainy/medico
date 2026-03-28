package com.medico.backend.dto;

import com.medico.backend.entity.RoleName;
import com.medico.backend.entity.DoctorVerificationStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String phoneNumber;
    private RoleName role;
    private DoctorVerificationStatus doctorVerificationStatus;
    private String firstName;
    private String lastName;
    private Long profileId;
}
