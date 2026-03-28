package com.medico.backend.controller;

import com.medico.backend.dto.AdminDoctorResponse;
import com.medico.backend.dto.AdminDoctorVerificationActionRequest;
import com.medico.backend.dto.AdminDoctorVerificationResponse;
import com.medico.backend.dto.AdminPatientResponse;
import com.medico.backend.dto.FamilyMemberResponse;
import com.medico.backend.entity.DoctorVerificationStatus;
import com.medico.backend.entity.User;
import com.medico.backend.service.AdminService;
import com.medico.backend.service.UserService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    public AdminController(AdminService adminService, UserService userService) {
        this.adminService = adminService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/doctors")
    public ResponseEntity<List<AdminDoctorResponse>> getDoctors(
        @RequestParam(required = false) String hospitalName
    ) {
        return ResponseEntity.ok(adminService.getDoctors(hospitalName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/patients")
    public ResponseEntity<List<AdminPatientResponse>> getPatients() {
        return ResponseEntity.ok(adminService.getPatients());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/patients/{patientId}/family-members")
    public ResponseEntity<List<FamilyMemberResponse>> getFamilyMembers(
        @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(adminService.getFamilyMembersForPatient(patientId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/doctor-verifications")
    public ResponseEntity<List<AdminDoctorVerificationResponse>> getDoctorVerifications(
        @RequestParam(required = false) DoctorVerificationStatus status
    ) {
        return ResponseEntity.ok(adminService.getDoctorVerificationQueue(status));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/doctor-verifications/{doctorId}/approve")
    public ResponseEntity<AdminDoctorVerificationResponse> approveDoctor(
        @PathVariable Long doctorId,
        @RequestBody(required = false) AdminDoctorVerificationActionRequest request
    ) {
        User admin = userService.getCurrentUser();
        String note = request == null ? null : request.getNote();
        return ResponseEntity.ok(adminService.approveDoctor(doctorId, note, admin));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/doctor-verifications/{doctorId}/reject")
    public ResponseEntity<AdminDoctorVerificationResponse> rejectDoctor(
        @PathVariable Long doctorId,
        @RequestBody(required = false) AdminDoctorVerificationActionRequest request
    ) {
        User admin = userService.getCurrentUser();
        String note = request == null ? null : request.getNote();
        return ResponseEntity.ok(adminService.rejectDoctor(doctorId, note, admin));
    }
}
