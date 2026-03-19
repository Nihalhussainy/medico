package com.medico.backend.service;

import com.medico.backend.dto.ConsentStatusResponse;
import com.medico.backend.entity.AuditAction;
import com.medico.backend.entity.ConsentStatus;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.OtpConsent;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.OtpConsentRepository;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.utils.OtpGenerator;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OtpConsentService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final OtpConsentRepository otpConsentRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final int otpExpiryMinutes;
    private final int consentValidityMinutes;

    public OtpConsentService(
        PatientRepository patientRepository,
        DoctorRepository doctorRepository,
        OtpConsentRepository otpConsentRepository,
        EmailService emailService,
        AuditLogService auditLogService,
        @Value("${app.otp.expiration-minutes}") int otpExpiryMinutes,
        @Value("${app.consent.validity-minutes}") int consentValidityMinutes
    ) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.otpConsentRepository = otpConsentRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.otpExpiryMinutes = otpExpiryMinutes;
        this.consentValidityMinutes = consentValidityMinutes;
    }

    public ConsentStatusResponse requestConsent(String doctorPhoneNumber, String patientPhoneNumber, User actor, String ipAddress) {
        Doctor doctor = doctorRepository.findByPhoneNumber(doctorPhoneNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        Patient patient = patientRepository.findByPhoneNumber(patientPhoneNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        String otp = OtpGenerator.generateSixDigit();
        Instant expiresAt = Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES);
        OtpConsent consent = OtpConsent.builder()
            .doctor(doctor)
            .patient(patient)
            .doctorPhoneNumber(doctorPhoneNumber)
            .patientPhoneNumber(patientPhoneNumber)
            .otpCode(otp)
            .status(ConsentStatus.PENDING)
            .expiresAt(expiresAt)
            .build();
        otpConsentRepository.save(consent);
        String patientEmail = patient.getUser().getEmail();
        String doctorName = doctor.getFirstName() + " " + doctor.getLastName();
        emailService.sendOtpEmail(patientEmail, otp, doctorName);
        auditLogService.log(actor, AuditAction.CONSENT_REQUEST, "OtpConsent", consent.getId().toString(), ipAddress,
            "Doctor requested access to patient records");

        return ConsentStatusResponse.builder()
            .status(consent.getStatus())
            .expiresAt(consent.getExpiresAt())
            .otp(emailService.isMock() ? otp : null)
            .destinationEmail(patientEmail)
            .build();
    }

    public ConsentStatusResponse verifyConsent(String doctorPhoneNumber, String patientPhoneNumber, String otp, User actor, String ipAddress) {
        OtpConsent consent = otpConsentRepository
            .findTopByPatientPhoneNumberAndDoctorPhoneNumberAndOtpCodeOrderByIdDesc(patientPhoneNumber, doctorPhoneNumber, otp)
            .orElseThrow(() -> new BadRequestException("Invalid OTP"));

        if (Instant.now().isAfter(consent.getExpiresAt())) {
            consent.setStatus(ConsentStatus.EXPIRED);
            otpConsentRepository.save(consent);
            throw new BadRequestException("OTP expired");
        }

        consent.setStatus(ConsentStatus.VERIFIED);
        consent.setVerifiedAt(Instant.now());
        // Set consent valid until end of day (11:59:59 PM)
        Instant endOfDay = LocalDate.now()
            .atTime(LocalTime.MAX)
            .atZone(ZoneId.systemDefault())
            .toInstant();
        consent.setConsentValidUntil(endOfDay);
        otpConsentRepository.save(consent);

        auditLogService.log(actor, AuditAction.CONSENT_VERIFY, "OtpConsent", consent.getId().toString(), ipAddress,
            "Patient verified access consent");

        return ConsentStatusResponse.builder()
            .status(consent.getStatus())
            .expiresAt(consent.getExpiresAt())
            .consentValidUntil(consent.getConsentValidUntil())
            .build();
    }

    public boolean hasValidConsent(String doctorPhoneNumber, String patientPhoneNumber) {
        OtpConsent consent = otpConsentRepository
            .findTopByPatientPhoneNumberAndDoctorPhoneNumberOrderByIdDesc(patientPhoneNumber, doctorPhoneNumber)
            .orElse(null);
        if (consent == null || consent.getStatus() != ConsentStatus.VERIFIED) {
            return false;
        }
        return consent.getConsentValidUntil() != null && Instant.now().isBefore(consent.getConsentValidUntil());
    }

    public ConsentStatusResponse getConsentStatus(String doctorPhoneNumber, String patientPhoneNumber) {
        OtpConsent consent = otpConsentRepository
            .findTopByPatientPhoneNumberAndDoctorPhoneNumberOrderByIdDesc(patientPhoneNumber, doctorPhoneNumber)
            .orElse(null);
        if (consent == null) {
            return ConsentStatusResponse.builder().status(ConsentStatus.REJECTED).build();
        }
        return ConsentStatusResponse.builder()
            .status(consent.getStatus())
            .expiresAt(consent.getExpiresAt())
            .consentValidUntil(consent.getConsentValidUntil())
            .build();
    }
}
