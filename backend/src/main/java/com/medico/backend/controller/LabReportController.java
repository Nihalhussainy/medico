package com.medico.backend.controller;

import com.medico.backend.dto.LabReportItemResponse;
import com.medico.backend.entity.User;
import com.medico.backend.service.LabReportService;
import com.medico.backend.service.UserService;
import java.io.IOException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/lab-reports")
public class LabReportController {

    private final LabReportService labReportService;
    private final UserService userService;

    public LabReportController(LabReportService labReportService, UserService userService) {
        this.labReportService = labReportService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/mine")
    public ResponseEntity<List<LabReportItemResponse>> listMine() {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(labReportService.listMine(actor));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping(value = "/mine", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LabReportItemResponse> uploadMine(@RequestPart("file") MultipartFile file) throws IOException {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(labReportService.uploadMine(actor, file));
    }
}
