package com.medico.backend.service;

import com.medico.backend.dto.FamilyGroupResponse;
import com.medico.backend.dto.FamilyMemberRequest;
import com.medico.backend.dto.FamilyMemberResponse;
import com.medico.backend.entity.FamilyGroup;
import com.medico.backend.entity.FamilyMember;
import com.medico.backend.entity.Patient;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.FamilyGroupRepository;
import com.medico.backend.repository.FamilyMemberRepository;
import com.medico.backend.repository.PatientRepository;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class FamilyService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PatientRepository patientRepository;

    public FamilyService(
        FamilyGroupRepository familyGroupRepository,
        FamilyMemberRepository familyMemberRepository,
        PatientRepository patientRepository
    ) {
        this.familyGroupRepository = familyGroupRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.patientRepository = patientRepository;
    }

    @SuppressWarnings("null")
    public FamilyGroupResponse getOrCreateFamilyGroupForCurrentPatient(Patient ownerPatient) {
        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(ownerPatient.getId())
            .orElse(null);

        if (group == null) {
            group = familyGroupRepository.save(FamilyGroup.builder()
                .ownerPatient(ownerPatient)
                .familyName(buildDefaultFamilyName(ownerPatient))
                .createdAt(Instant.now())
                .build());
        }

        return toGroupResponse(group);
    }

    public List<FamilyMemberResponse> getMembersByPatientPhone(String patientPhoneNumber) {
        Patient patient = patientRepository.findByPhoneNumber(patientPhoneNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(patient.getId())
            .orElse(null);

        if (group == null) {
            return List.of();
        }

        return familyMemberRepository.findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(group.getId())
            .stream()
            .map(this::toMemberResponse)
            .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    public FamilyMemberResponse addMember(Patient ownerPatient, FamilyMemberRequest request) {
        validateMemberRequest(request);

        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(ownerPatient.getId())
            .orElse(null);

        if (group == null) {
            group = familyGroupRepository.save(FamilyGroup.builder()
                .ownerPatient(ownerPatient)
                .familyName(buildDefaultFamilyName(ownerPatient))
                .createdAt(Instant.now())
                .build());
        }

        FamilyMember member = FamilyMember.builder()
            .familyGroup(group)
            .firstName(request.getFirstName().trim())
            .lastName(request.getLastName().trim())
            .relationship(request.getRelationship().trim())
            .dateOfBirth(request.getDateOfBirth())
            .gender(request.getGender())
            .bloodGroup(request.getBloodGroup())
            .phoneNumber(request.getPhoneNumber())
            .profilePhotoUrl(request.getProfilePhotoUrl())
            .isActive(true)
            .createdAt(Instant.now())
            .build();

        FamilyMember savedMember = familyMemberRepository.save(member);
        return toMemberResponse(savedMember);
    }

    public FamilyMemberResponse updateMember(Patient ownerPatient, Long memberId, FamilyMemberRequest request) {
        validateMemberRequest(request);

        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(ownerPatient.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Family group not found"));

        FamilyMember member = familyMemberRepository.findByIdAndFamilyGroupIdAndIsActiveTrue(memberId, group.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Family member not found"));

        member.setFirstName(request.getFirstName().trim());
        member.setLastName(request.getLastName().trim());
        member.setRelationship(request.getRelationship().trim());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setGender(request.getGender());
        member.setBloodGroup(request.getBloodGroup());
        member.setPhoneNumber(request.getPhoneNumber());
        member.setProfilePhotoUrl(request.getProfilePhotoUrl());

        FamilyMember savedMember = familyMemberRepository.save(member);
        return toMemberResponse(savedMember);
    }

    public void removeMember(Patient ownerPatient, Long memberId) {
        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(ownerPatient.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Family group not found"));

        FamilyMember member = familyMemberRepository.findByIdAndFamilyGroupIdAndIsActiveTrue(memberId, group.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Family member not found"));

        member.setIsActive(false);
        familyMemberRepository.save(member);
    }

    public FamilyMember resolveMemberForPatient(Long memberId, Patient patient) {
        if (memberId == null) {
            return null;
        }

        FamilyGroup group = familyGroupRepository.findByOwnerPatientId(patient.getId())
            .orElseThrow(() -> new BadRequestException("Family group not found for patient"));

        return familyMemberRepository.findByIdAndFamilyGroupIdAndIsActiveTrue(memberId, group.getId())
            .orElseThrow(() -> new BadRequestException("Selected family member does not belong to patient"));
    }

    private FamilyGroupResponse toGroupResponse(FamilyGroup group) {
        List<FamilyMemberResponse> members = familyMemberRepository
            .findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(group.getId())
            .stream()
            .map(this::toMemberResponse)
            .collect(Collectors.toList());

        return FamilyGroupResponse.builder()
            .id(group.getId())
            .familyName(group.getFamilyName())
            .createdAt(group.getCreatedAt())
            .members(members)
            .build();
    }

    private FamilyMemberResponse toMemberResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
            .id(member.getId())
            .firstName(member.getFirstName())
            .lastName(member.getLastName())
            .relationship(member.getRelationship())
            .dateOfBirth(member.getDateOfBirth())
            .gender(member.getGender())
            .bloodGroup(member.getBloodGroup())
            .phoneNumber(member.getPhoneNumber())
            .profilePhotoUrl(member.getProfilePhotoUrl())
            .isActive(member.getIsActive())
            .createdAt(member.getCreatedAt())
            .build();
    }

    private void validateMemberRequest(FamilyMemberRequest request) {
        if (request == null) {
            throw new BadRequestException("Family member payload is required");
        }
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new BadRequestException("First name is required");
        }
        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new BadRequestException("Last name is required");
        }
        if (request.getRelationship() == null || request.getRelationship().isBlank()) {
            throw new BadRequestException("Relationship is required");
        }
    }

    private String buildDefaultFamilyName(Patient patient) {
        String lastName = patient.getLastName() == null ? "Family" : patient.getLastName();
        return lastName + " Family";
    }
}
