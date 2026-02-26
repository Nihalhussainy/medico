package com.medico.backend.controller;

import com.medico.backend.dto.AdminDoctorResponse;
import com.medico.backend.dto.AdminPatientResponse;
import com.medico.backend.service.AdminService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
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
}
