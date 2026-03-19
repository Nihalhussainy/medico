package com.medico.backend.controller;

import com.medico.backend.dto.MedicalFileResponse;
import com.medico.backend.entity.User;
import com.medico.backend.service.MedicalFileService;
import com.medico.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/records")
public class MedicalFileController {

    private final MedicalFileService medicalFileService;
    private final UserService userService;

    public MedicalFileController(MedicalFileService medicalFileService, UserService userService) {
        this.medicalFileService = medicalFileService;
        this.userService = userService;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @PostMapping(value = "/{recordId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MedicalFileResponse> uploadFile(
        @PathVariable Long recordId,
        @RequestPart("file") MultipartFile file,
        @org.springframework.web.bind.annotation.RequestParam(name = "category", required = false) String category,
        HttpServletRequest httpRequest
    ) throws IOException {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(medicalFileService.uploadFile(recordId, file, category, actor, httpRequest.getRemoteAddr()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    @GetMapping("/{recordId}/files")
    public ResponseEntity<List<MedicalFileResponse>> listFiles(@PathVariable Long recordId) {
        User actor = userService.getCurrentUser();
        return ResponseEntity.ok(medicalFileService.listFiles(recordId, actor));
    }
}
