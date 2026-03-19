package com.medico.backend.service;

import com.medico.backend.dto.MedicalFileResponse;
import com.medico.backend.entity.AuditAction;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.MedicalFile;
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
import com.medico.backend.utils.FileValidator;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MedicalFileService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalFileRepository medicalFileRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final OtpConsentService otpConsentService;
    private final LocalFileStorageService localFileStorageService;
    private final AuditLogService auditLogService;

    public MedicalFileService(
        MedicalRecordRepository medicalRecordRepository,
        MedicalFileRepository medicalFileRepository,
        DoctorRepository doctorRepository,
        PatientRepository patientRepository,
        OtpConsentService otpConsentService,
        LocalFileStorageService localFileStorageService,
        AuditLogService auditLogService
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.medicalFileRepository = medicalFileRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.otpConsentService = otpConsentService;
        this.localFileStorageService = localFileStorageService;
        this.auditLogService = auditLogService;
    }

    public MedicalFileResponse uploadFile(Long recordId, MultipartFile file, String category, User actor, String ipAddress) throws IOException {
        FileValidator.validate(file);
        MedicalRecord record = medicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Record not found"));

        String uploaderRole;
        String uploaderName;

        if (actor.getRole().getName() == RoleName.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (!otpConsentService.hasValidConsent(doctor.getPhoneNumber(), record.getPatient().getPhoneNumber())) {
                throw new BadRequestException("Consent required to upload files");
            }
            uploaderRole = "DOCTOR";
            uploaderName = (doctor.getFirstName() + " " + doctor.getLastName()).trim();
        } else if (actor.getRole().getName() == RoleName.PATIENT) {
            Patient patient = patientRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Patient profile not found"));
            if (!patient.getId().equals(record.getPatient().getId())) {
                throw new BadRequestException("Not allowed to upload files for this record");
            }
            uploaderRole = "PATIENT";
            uploaderName = (patient.getFirstName() + " " + patient.getLastName()).trim();
        } else {
            throw new BadRequestException("Not allowed to upload files");
        }

        StorageResult uploadResult = localFileStorageService.store(file);
        String url = uploadResult.getUrl();
        String publicId = uploadResult.getStorageKey();

        String safeCategory = (category == null || category.isBlank()) ? "OTHER" : category.trim().toUpperCase();
        MedicalFile medicalFile = MedicalFile.builder()
            .record(record)
            .url(url)
            .publicId(publicId)
            .fileType(file.getContentType())
            .originalFileName(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename())
            .category(safeCategory)
            .uploadedByRole(uploaderRole)
            .uploadedByName(uploaderName.isBlank() ? actor.getEmail() : uploaderName)
            .createdAt(Instant.now())
            .build();
        medicalFileRepository.save(medicalFile);

        auditLogService.log(actor, AuditAction.FILE_UPLOAD, "MedicalRecord", record.getId().toString(), ipAddress, null);

        return MedicalFileResponse.builder()
            .id(medicalFile.getId())
            .url(medicalFile.getUrl())
            .fileType(medicalFile.getFileType())
            .originalFileName(medicalFile.getOriginalFileName())
            .category(medicalFile.getCategory())
            .uploadedByRole(medicalFile.getUploadedByRole())
            .uploadedByName(medicalFile.getUploadedByName())
            .createdAt(medicalFile.getCreatedAt())
            .build();
    }

    public List<MedicalFileResponse> listFiles(Long recordId, User actor) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Record not found"));

        if (actor.getRole().getName() == RoleName.PATIENT) {
            Patient patient = patientRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Patient profile not found"));
            if (!patient.getPhoneNumber().equals(record.getPatient().getPhoneNumber())) {
                throw new BadRequestException("Not allowed");
            }
        }

        if (actor.getRole().getName() == RoleName.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (!otpConsentService.hasValidConsent(doctor.getPhoneNumber(), record.getPatient().getPhoneNumber())) {
                throw new BadRequestException("Consent required to view files");
            }
        }

        return medicalFileRepository.findByRecordId(recordId).stream()
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
    }
}
