package com.medico.backend.service;

import com.medico.backend.dto.AdminDoctorResponse;
import com.medico.backend.dto.AdminDoctorVerificationResponse;
import com.medico.backend.dto.AdminPatientResponse;
import com.medico.backend.dto.FamilyMemberResponse;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.DoctorVerificationStatus;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.FamilyMember;
import com.medico.backend.entity.User;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.repository.FamilyMemberRepository;
import com.medico.backend.repository.FamilyGroupRepository;
import java.time.LocalDate;
import java.time.Period;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyGroupRepository familyGroupRepository;

    public AdminService(
        DoctorRepository doctorRepository,
        PatientRepository patientRepository,
        FamilyMemberRepository familyMemberRepository,
        FamilyGroupRepository familyGroupRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.familyGroupRepository = familyGroupRepository;
    }

    public List<AdminDoctorResponse> getDoctors(String hospitalName) {
        List<Doctor> doctors = (hospitalName == null || hospitalName.isBlank())
            ? doctorRepository.findAll()
            : doctorRepository.findByHospitalNameIgnoreCase(hospitalName.trim());

        return doctors.stream()
            .map(doctor -> AdminDoctorResponse.builder()
                .id(doctor.getId())
                .fullName(doctor.getFirstName() + " " + doctor.getLastName())
                .email(doctor.getUser().getEmail())
                .phoneNumber(doctor.getPhoneNumber())
                .specialization(doctor.getSpecialization())
                .hospitalName(doctor.getHospitalName())
                .verificationStatus(doctor.getVerificationStatus())
                .build())
            .collect(Collectors.toList());
    }

    public List<AdminDoctorVerificationResponse> getDoctorVerificationQueue(DoctorVerificationStatus status) {
        List<Doctor> doctors = status == null
            ? doctorRepository.findAllByOrderByIdDesc()
            : doctorRepository.findByVerificationStatusOrderByIdDesc(status);

        return doctors.stream()
            .map(this::toDoctorVerificationResponse)
            .collect(Collectors.toList());
    }

    public AdminDoctorVerificationResponse approveDoctor(Long doctorId, String note, User admin) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        doctor.setVerificationStatus(DoctorVerificationStatus.APPROVED);
        doctor.setVerificationNote(note);
        doctor.setVerifiedAt(Instant.now());
        doctor.setVerifiedByEmail(admin.getEmail());
        doctorRepository.save(doctor);
        return toDoctorVerificationResponse(doctor);
    }

    public AdminDoctorVerificationResponse rejectDoctor(Long doctorId, String note, User admin) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        doctor.setVerificationStatus(DoctorVerificationStatus.REJECTED);
        doctor.setVerificationNote(note);
        doctor.setVerifiedAt(Instant.now());
        doctor.setVerifiedByEmail(admin.getEmail());
        doctorRepository.save(doctor);
        return toDoctorVerificationResponse(doctor);
    }

    public List<AdminPatientResponse> getPatients() {
        List<Patient> patients = patientRepository.findAll();
        return patients.stream()
            .map(this::toPatientResponse)
            .collect(Collectors.toList());
    }

    public List<FamilyMemberResponse> getFamilyMembersForPatient(Long patientId) {
        var familyGroup = familyGroupRepository.findByOwnerPatientId(patientId);
        if (familyGroup.isEmpty()) {
            return List.of();
        }
        return familyMemberRepository.findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(familyGroup.get().getId())
            .stream()
            .map(this::toFamilyMemberResponse)
            .collect(Collectors.toList());
    }

    private AdminPatientResponse toPatientResponse(Patient patient) {
        Integer age = null;
        LocalDate dob = patient.getDateOfBirth();
        if (dob != null) {
            age = Period.between(dob, LocalDate.now()).getYears();
        }
        return AdminPatientResponse.builder()
            .id(patient.getId())
            .fullName(patient.getFirstName() + " " + patient.getLastName())
            .age(age)
            .gender(patient.getGender())
            .phoneNumber(patient.getPhoneNumber())
            .bloodGroup(patient.getBloodGroup())
            .location(patient.getLocation())
            .build();
    }

    private FamilyMemberResponse toFamilyMemberResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
            .id(member.getId())
            .firstName(member.getFirstName())
            .lastName(member.getLastName())
            .relationship(member.getRelationship())
            .dateOfBirth(member.getDateOfBirth())
            .gender(member.getGender())
            .bloodGroup(member.getBloodGroup())
            .phoneNumber(member.getPhoneNumber())
            .isActive(member.getIsActive())
            .createdAt(member.getCreatedAt())
            .build();
    }

    private AdminDoctorVerificationResponse toDoctorVerificationResponse(Doctor doctor) {
        return AdminDoctorVerificationResponse.builder()
            .id(doctor.getId())
            .fullName(doctor.getFirstName() + " " + doctor.getLastName())
            .email(doctor.getUser().getEmail())
            .phoneNumber(doctor.getPhoneNumber())
            .specialization(doctor.getSpecialization())
            .licenseNumber(doctor.getLicenseNumber())
            .hospitalName(doctor.getHospitalName())
            .verificationStatus(doctor.getVerificationStatus())
            .verificationNote(doctor.getVerificationNote())
            .verifiedAt(doctor.getVerifiedAt())
            .verifiedByEmail(doctor.getVerifiedByEmail())
            .registeredAt(doctor.getUser().getCreatedAt())
            .build();
    }
}
