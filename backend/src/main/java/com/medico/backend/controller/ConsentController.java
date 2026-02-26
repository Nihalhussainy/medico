package com.medico.backend.controller;

import com.medico.backend.dto.ConsentStatusResponse;
import com.medico.backend.dto.OtpConsentRequest;
import com.medico.backend.dto.OtpVerifyRequest;
import com.medico.backend.entity.User;
import com.medico.backend.service.OtpConsentService;
import com.medico.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/consent")
public class ConsentController {

    private final OtpConsentService otpConsentService;
    private final UserService userService;

    public ConsentController(OtpConsentService otpConsentService, UserService userService) {
        this.otpConsentService = otpConsentService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/request")
    public ResponseEntity<ConsentStatusResponse> requestConsent(
        @Valid @RequestBody OtpConsentRequest request,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        String doctorPhoneNumber = actor.getPhoneNumber();
        return ResponseEntity.ok(otpConsentService.requestConsent(doctorPhoneNumber, request.getPatientPhoneNumber(), actor, httpRequest.getRemoteAddr()));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/verify")
    public ResponseEntity<ConsentStatusResponse> verifyConsent(
        @Valid @RequestBody OtpVerifyRequest request,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        String doctorPhoneNumber = actor.getPhoneNumber();
        return ResponseEntity.ok(otpConsentService.verifyConsent(doctorPhoneNumber, request.getPatientPhoneNumber(), request.getOtpCode(), actor,
            httpRequest.getRemoteAddr()));
    }

    @GetMapping("/status")
    public ResponseEntity<ConsentStatusResponse> getStatus(
        @RequestParam String doctorPhoneNumber,
        @RequestParam String patientPhoneNumber
    ) {
        return ResponseEntity.ok(otpConsentService.getConsentStatus(doctorPhoneNumber, patientPhoneNumber));
    }
}
