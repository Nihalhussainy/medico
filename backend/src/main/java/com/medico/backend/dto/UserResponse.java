package com.medico.backend.dto;

import com.medico.backend.entity.RoleName;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String phoneNumber;
    private RoleName role;
    private String firstName;
    private String lastName;
    private Long profileId;
}
