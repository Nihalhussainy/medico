package com.medico.backend.dto;

import com.medico.backend.entity.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{10}", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @NotBlank
    private String password;

    @NotNull
    private RoleName role;

    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;

    private String specialization;
    private String licenseNumber;
    private String hospitalName;
}
