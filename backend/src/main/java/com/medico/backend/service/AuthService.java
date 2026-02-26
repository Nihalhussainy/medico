package com.medico.backend.service;

import com.medico.backend.dto.AuthRequest;
import com.medico.backend.dto.AuthResponse;
import com.medico.backend.dto.RegisterRequest;
import com.medico.backend.dto.UserResponse;
import com.medico.backend.entity.AuditAction;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.Role;
import com.medico.backend.entity.RoleName;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.repository.RoleRepository;
import com.medico.backend.repository.UserRepository;
import com.medico.backend.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PatientRepository patientRepository,
        DoctorRepository doctorRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtTokenProvider jwtTokenProvider,
        AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditLogService = auditLogService;
    }

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BadRequestException("Phone number already registered");
        }
        Role role = roleRepository.findByName(request.getRole())
            .orElseThrow(() -> new BadRequestException("Invalid role"));

        User user = User.builder()
            .email(request.getEmail())
            .phoneNumber(required(request.getPhoneNumber(), "phoneNumber"))
            .password(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .enabled(true)
            .createdAt(Instant.now())
            .build();
        userRepository.save(user);

        if (request.getRole() == RoleName.PATIENT) {
            Patient patient = Patient.builder()
                .user(user)
                .firstName(required(request.getFirstName(), "firstName"))
                .lastName(required(request.getLastName(), "lastName"))
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .phoneNumber(user.getPhoneNumber())
                .build();
            patientRepository.save(patient);
            return toUserResponse(user, patient.getId(), patient.getFirstName(), patient.getLastName());
        }

        if (request.getRole() == RoleName.DOCTOR) {
            Doctor doctor = Doctor.builder()
                .user(user)
                .firstName(required(request.getFirstName(), "firstName"))
                .lastName(required(request.getLastName(), "lastName"))
                .specialization(required(request.getSpecialization(), "specialization"))
                .licenseNumber(required(request.getLicenseNumber(), "licenseNumber"))
                .phoneNumber(user.getPhoneNumber())
                .hospitalName(request.getHospitalName())
                .build();
            doctorRepository.save(doctor);
            return toUserResponse(user, doctor.getId(), doctor.getFirstName(), doctor.getLastName());
        }

        return toUserResponse(user, null, null, null);
    }

    public AuthResponse login(AuthRequest request, HttpServletRequest httpRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password");
        }
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().getName());
        auditLogService.log(user, AuditAction.LOGIN, "User", user.getId().toString(), httpRequest.getRemoteAddr(), null);
        return AuthResponse.builder()
            .token(token)
            .user(buildUserResponse(user))
            .build();
    }

    public UserResponse buildUserResponse(User user) {
        if (user.getRole().getName() == RoleName.PATIENT) {
            Patient patient = patientRepository.findByUserId(user.getId()).orElse(null);
            if (patient != null) {
                return toUserResponse(user, patient.getId(), patient.getFirstName(), patient.getLastName());
            }
        }
        if (user.getRole().getName() == RoleName.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(user.getId()).orElse(null);
            if (doctor != null) {
                return toUserResponse(user, doctor.getId(), doctor.getFirstName(), doctor.getLastName());
            }
        }
        return toUserResponse(user, null, null, null);
    }

    private UserResponse toUserResponse(User user, Long profileId, String firstName, String lastName) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole().getName())
            .profileId(profileId)
            .firstName(firstName)
            .lastName(lastName)
            .build();
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(field + " is required");
        }
        return value;
    }
}
