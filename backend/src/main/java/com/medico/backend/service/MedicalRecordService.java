package com.medico.backend.service;

import com.medico.backend.dto.MedicalFileResponse;
import com.medico.backend.dto.MedicalRecordCreateRequest;
import com.medico.backend.dto.MedicalRecordResponse;
import com.medico.backend.dto.MedicalRecordUpdateRequest;
import com.medico.backend.entity.AuditAction;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.FamilyMember;
import com.medico.backend.entity.MedicalRecord;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.RoleName;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.MedicalFileRepository;
import com.medico.backend.repository.MedicalRecordRepository;
import com.medico.backend.repository.PatientRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalFileRepository medicalFileRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final OtpConsentService otpConsentService;
    private final AuditLogService auditLogService;
    private final FamilyService familyService;

    public MedicalRecordService(
        MedicalRecordRepository medicalRecordRepository,
        MedicalFileRepository medicalFileRepository,
        DoctorRepository doctorRepository,
        PatientRepository patientRepository,
        OtpConsentService otpConsentService,
        AuditLogService auditLogService,
        FamilyService familyService
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.medicalFileRepository = medicalFileRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.otpConsentService = otpConsentService;
        this.auditLogService = auditLogService;
        this.familyService = familyService;
    }

    public MedicalRecordResponse createRecord(MedicalRecordCreateRequest request, User actor, String ipAddress) {
        Doctor doctor = doctorRepository.findByUserId(actor.getId())
            .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
        Patient patient = patientRepository.findByPhoneNumber(request.getPatientPhoneNumber())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (!otpConsentService.hasValidConsent(doctor.getPhoneNumber(), patient.getPhoneNumber())) {
            throw new BadRequestException("Consent required to create record");
        }

        FamilyMember familyMember = familyService.resolveMemberForPatient(request.getFamilyMemberId(), patient);

        MedicalRecord record = MedicalRecord.builder()
            .patient(patient)
            .doctor(doctor)
            .title(request.getTitle())
            .description(request.getDescription())
            .hospitalName(request.getHospitalName())
            .diagnosis(request.getDiagnosis())
            .vitals(request.getVitals())
            .medications(request.getMedications())
            .allergies(request.getAllergies())
            .advice(request.getAdvice())
            .medicineDuration(request.getMedicineDuration())
            .familyMember(familyMember)
            .followUpDate(request.getFollowUpDate())
            .recordDate(request.getRecordDate())
            .createdAt(Instant.now())
            .build();
        medicalRecordRepository.save(record);
        auditLogService.log(actor, AuditAction.RECORD_CREATE, "MedicalRecord", record.getId().toString(), ipAddress, null);
        return toResponse(record, List.of());
    }

    public List<MedicalRecordResponse> getRecordsForPatient(String patientPhoneNumber, User actor, String ipAddress) {
        Patient patient = patientRepository.findByPhoneNumber(patientPhoneNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (actor.getRole().getName() == RoleName.PATIENT) {
            Patient actorPatient = patientRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Patient profile not found"));
            if (!actorPatient.getPhoneNumber().equals(patientPhoneNumber)) {
                throw new BadRequestException("Not allowed");
            }
        }

        if (actor.getRole().getName() == RoleName.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (!otpConsentService.hasValidConsent(doctor.getPhoneNumber(), patientPhoneNumber)) {
                throw new BadRequestException("Consent required to view records");
            }
        }

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());
        List<MedicalRecordResponse> responses = records.stream()
            .map(record -> toResponse(record, medicalFileRepository.findByRecordId(record.getId()).stream()
                .map(file -> MedicalFileResponse.builder()
                    .id(file.getId())
                    .url(file.getUrl())
                    .fileType(file.getFileType())
                    .originalFileName(file.getOriginalFileName())
                    .category(file.getCategory())
                    .uploadedByRole(file.getUploadedByRole())
                    .uploadedByName(file.getUploadedByName())
                    .createdAt(file.getCreatedAt())
                    .build())
                .collect(Collectors.toList())))
            .collect(Collectors.toList());

        auditLogService.log(actor, AuditAction.RECORD_VIEW, "Patient", patient.getId().toString(), ipAddress, null);
        return responses;
    }

    private MedicalRecordResponse toResponse(MedicalRecord record, List<MedicalFileResponse> files) {
        String doctorName = record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName();
        FamilyMember member = record.getFamilyMember();
        return MedicalRecordResponse.builder()
            .id(record.getId())
            .patientId(record.getPatient().getId())
            .doctorId(record.getDoctor().getId())
            .doctorName(doctorName)
            .doctorSpecialization(record.getDoctor().getSpecialization())
            .title(record.getTitle())
            .description(record.getDescription())
            .hospitalName(record.getHospitalName())
            .diagnosis(record.getDiagnosis())
            .vitals(record.getVitals())
            .medications(record.getMedications())
            .allergies(record.getAllergies())
            .advice(record.getAdvice())
            .medicineDuration(record.getMedicineDuration())
            .familyMemberId(member != null ? member.getId() : null)
            .familyMemberFirstName(member != null ? member.getFirstName() : null)
            .familyMemberLastName(member != null ? member.getLastName() : null)
            .familyMemberRelationship(member != null ? member.getRelationship() : null)
            .followUpDate(record.getFollowUpDate())
            .recordDate(record.getRecordDate())
            .createdAt(record.getCreatedAt())
            .files(files)
            .build();
    }

    public MedicalRecordResponse updateRecord(Long recordId, MedicalRecordUpdateRequest request, User actor, String ipAddress) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        Doctor doctor = doctorRepository.findByUserId(actor.getId())
            .orElseThrow(() -> new BadRequestException("Doctor profile not found"));

        // Only the doctor who created the record can update it
        if (!record.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("Only the creating doctor can update this record");
        }

        // Check if record is older than 24 hours
        Instant twentyFourHoursAgo = Instant.now().minus(24, ChronoUnit.HOURS);
        if (record.getCreatedAt().isBefore(twentyFourHoursAgo)) {
            throw new BadRequestException("Cannot edit record after 24 hours");
        }

        record.setTitle(request.getTitle());
        record.setDescription(request.getDescription());
        record.setHospitalName(request.getHospitalName());
        record.setDiagnosis(request.getDiagnosis());
        record.setVitals(request.getVitals());
        record.setMedications(request.getMedications());
        record.setAllergies(request.getAllergies());
        record.setAdvice(request.getAdvice());
        record.setMedicineDuration(request.getMedicineDuration());

        if (request.getFamilyMemberId() == null) {
            record.setFamilyMember(null);
        } else {
            record.setFamilyMember(familyService.resolveMemberForPatient(request.getFamilyMemberId(), record.getPatient()));
        }

        record.setFollowUpDate(request.getFollowUpDate());
        record.setRecordDate(request.getRecordDate());

        medicalRecordRepository.save(record);
        auditLogService.log(actor, AuditAction.RECORD_UPDATE, "MedicalRecord", record.getId().toString(), ipAddress, null);

        List<MedicalFileResponse> files = medicalFileRepository.findByRecordId(record.getId()).stream()
            .map(file -> MedicalFileResponse.builder()
                .id(file.getId())
                .url(file.getUrl())
                .fileType(file.getFileType())
                .originalFileName(file.getOriginalFileName())
                .category(file.getCategory())
                .uploadedByRole(file.getUploadedByRole())
                .uploadedByName(file.getUploadedByName())
                .createdAt(file.getCreatedAt())
                .build())
            .collect(Collectors.toList());

        return toResponse(record, files);
    }

    public void deleteRecord(Long recordId, User actor, String ipAddress) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        Doctor doctor = doctorRepository.findByUserId(actor.getId())
            .orElseThrow(() -> new BadRequestException("Doctor profile not found"));

        // Only the doctor who created the record can delete it
        if (!record.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("Only the creating doctor can delete this record");
        }

        // Check if record is older than 24 hours
        Instant twentyFourHoursAgo = Instant.now().minus(24, ChronoUnit.HOURS);
        if (record.getCreatedAt().isBefore(twentyFourHoursAgo)) {
            throw new BadRequestException("Cannot delete record after 24 hours");
        }

        auditLogService.log(actor, AuditAction.RECORD_DELETE, "MedicalRecord", record.getId().toString(), ipAddress, null);
        medicalRecordRepository.delete(record);
    }
}
