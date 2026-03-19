package com.medico.backend.controller;

import com.medico.backend.dto.FamilyGroupResponse;
import com.medico.backend.dto.FamilyMemberRequest;
import com.medico.backend.dto.FamilyMemberResponse;
import com.medico.backend.entity.Patient;
import com.medico.backend.service.FamilyService;
import com.medico.backend.service.UserService;
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
@RequestMapping("/api/family")
public class FamilyController {

    private final FamilyService familyService;
    private final UserService userService;

    public FamilyController(FamilyService familyService, UserService userService) {
        this.familyService = familyService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/group")
    public ResponseEntity<FamilyGroupResponse> getMyFamilyGroup() {
        Patient ownerPatient = userService.getCurrentPatient();
        return ResponseEntity.ok(familyService.getOrCreateFamilyGroupForCurrentPatient(ownerPatient));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/members")
    public ResponseEntity<FamilyMemberResponse> addMember(@RequestBody FamilyMemberRequest request) {
        Patient ownerPatient = userService.getCurrentPatient();
        return ResponseEntity.ok(familyService.addMember(ownerPatient, request));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/members/{memberId}")
    public ResponseEntity<FamilyMemberResponse> updateMember(
        @PathVariable Long memberId,
        @RequestBody FamilyMemberRequest request
    ) {
        Patient ownerPatient = userService.getCurrentPatient();
        return ResponseEntity.ok(familyService.updateMember(ownerPatient, memberId, request));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long memberId) {
        Patient ownerPatient = userService.getCurrentPatient();
        familyService.removeMember(ownerPatient, memberId);
        return ResponseEntity.noContent().build();
    }
}
