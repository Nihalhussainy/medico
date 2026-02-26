package com.medico.backend.controller;

import com.medico.backend.dto.PatientDetailsResponse;
import com.medico.backend.dto.PatientProfileUpdateRequest;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.RoleName;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.service.OtpConsentService;
import com.medico.backend.service.UserService;
import java.time.LocalDate;
import java.time.Period;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final UserService userService;
    private final OtpConsentService otpConsentService;

    public PatientController(
        PatientRepository patientRepository,
        UserService userService,
        OtpConsentService otpConsentService
    ) {
        this.patientRepository = patientRepository;
        this.userService = userService;
        this.otpConsentService = otpConsentService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    @GetMapping("/phone/{phoneNumber}")
    public ResponseEntity<PatientDetailsResponse> getPatientByPhone(@PathVariable String phoneNumber) {
        User actor = userService.getCurrentUser();
        Patient patient = patientRepository.findByPhoneNumber(phoneNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (actor.getRole().getName() == RoleName.PATIENT) {
            if (!actor.getPhoneNumber().equals(phoneNumber)) {
                throw new BadRequestException("Not allowed");
            }
        }

        if (actor.getRole().getName() == RoleName.DOCTOR) {
            Doctor doctor = userService.getCurrentDoctor();
            if (!otpConsentService.hasValidConsent(doctor.getPhoneNumber(), phoneNumber)) {
                throw new BadRequestException("Consent required to view patient details");
            }
        }

        return ResponseEntity.ok(toResponse(patient));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/me")
    public ResponseEntity<PatientDetailsResponse> updateProfile(@RequestBody PatientProfileUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        Patient patient = patientRepository.findByUserId(currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            patient.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            patient.setLastName(request.getLastName());
        }
        if (request.getDateOfBirth() != null) {
            patient.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            patient.setGender(request.getGender());
        }
        if (request.getBloodGroup() != null && !request.getBloodGroup().isBlank()) {
            patient.setBloodGroup(request.getBloodGroup());
        }
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            patient.setLocation(request.getLocation());
        }

        patientRepository.save(patient);
        return ResponseEntity.ok(toResponse(patient));
    }

    private PatientDetailsResponse toResponse(Patient patient) {
        Integer age = null;
        LocalDate dob = patient.getDateOfBirth();
        if (dob != null) {
            age = Period.between(dob, LocalDate.now()).getYears();
        }
        return PatientDetailsResponse.builder()
            .fullName(patient.getFirstName() + " " + patient.getLastName())
            .age(age)
            .gender(patient.getGender())
            .phoneNumber(patient.getPhoneNumber())
            .dateOfBirth(dob)
            .bloodGroup(patient.getBloodGroup())
            .location(patient.getLocation())
            .build();
    }
}