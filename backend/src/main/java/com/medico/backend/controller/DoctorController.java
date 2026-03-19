package com.medico.backend.controller;

import com.medico.backend.dto.DoctorProfileResponse;
import com.medico.backend.dto.DoctorProfileUpdateRequest;
import com.medico.backend.repository.UserRepository;
import com.medico.backend.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;
    private final UserRepository userRepository;

    public DoctorController(DoctorService doctorService, UserRepository userRepository) {
        this.doctorService = doctorService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<DoctorProfileResponse> getMyProfile(Authentication authentication) {
        Long userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(doctorService.getProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<DoctorProfileResponse> updateMyProfile(
        @Valid @RequestBody DoctorProfileUpdateRequest request,
        Authentication authentication
    ) {
        Long userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(doctorService.updateProfile(userId, request));
    }

    @PutMapping("/me/profile-picture")
    public ResponseEntity<DoctorProfileResponse> uploadProfilePicture(
        @RequestParam("profilePicture") MultipartFile file,
        Authentication authentication
    ) {
        Long userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(doctorService.uploadProfilePicture(userId, file));
    }

    private Long extractUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .map(user -> user.getId())
            .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}

