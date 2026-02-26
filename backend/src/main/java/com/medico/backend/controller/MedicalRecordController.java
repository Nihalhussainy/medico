package com.medico.backend.controller;

import com.medico.backend.dto.MedicalRecordCreateRequest;
import com.medico.backend.dto.MedicalRecordResponse;
import com.medico.backend.dto.MedicalRecordUpdateRequest;
import com.medico.backend.entity.User;
import com.medico.backend.service.MedicalRecordService;
import com.medico.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final UserService userService;

    public MedicalRecordController(MedicalRecordService medicalRecordService, UserService userService) {
        this.medicalRecordService = medicalRecordService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public ResponseEntity<MedicalRecordResponse> createRecord(
        @Valid @RequestBody MedicalRecordCreateRequest request,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(medicalRecordService.createRecord(request, actor, httpRequest.getRemoteAddr()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    @GetMapping("/patient/{patientPhoneNumber}")
    public ResponseEntity<List<MedicalRecordResponse>> getRecords(
        @PathVariable String patientPhoneNumber,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(medicalRecordService.getRecordsForPatient(patientPhoneNumber, actor, httpRequest.getRemoteAddr()));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{recordId}")
    public ResponseEntity<MedicalRecordResponse> updateRecord(
        @PathVariable Long recordId,
        @Valid @RequestBody MedicalRecordUpdateRequest request,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(medicalRecordService.updateRecord(recordId, request, actor, httpRequest.getRemoteAddr()));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(
        @PathVariable Long recordId,
        HttpServletRequest httpRequest
    ) {
        User actor = userService.getCurrentUser();
        medicalRecordService.deleteRecord(recordId, actor, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
