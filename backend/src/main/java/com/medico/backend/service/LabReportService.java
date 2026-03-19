package com.medico.backend.service;

import com.medico.backend.dto.LabReportItemResponse;
import com.medico.backend.entity.MedicalFile;
import com.medico.backend.entity.MedicalRecord;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.PatientLabReport;
import com.medico.backend.entity.RoleName;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.repository.MedicalFileRepository;
import com.medico.backend.repository.MedicalRecordRepository;
import com.medico.backend.repository.PatientLabReportRepository;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.utils.FileValidator;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LabReportService {

    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalFileRepository medicalFileRepository;
    private final PatientLabReportRepository patientLabReportRepository;
    private final LocalFileStorageService localFileStorageService;

    public LabReportService(
        PatientRepository patientRepository,
        MedicalRecordRepository medicalRecordRepository,
        MedicalFileRepository medicalFileRepository,
        PatientLabReportRepository patientLabReportRepository,
        LocalFileStorageService localFileStorageService
    ) {
        this.patientRepository = patientRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.medicalFileRepository = medicalFileRepository;
        this.patientLabReportRepository = patientLabReportRepository;
        this.localFileStorageService = localFileStorageService;
    }

    public List<LabReportItemResponse> listMine(User actor) {
        Patient patient = patientRepository.findByUserId(actor.getId())
            .orElseThrow(() -> new BadRequestException("Patient profile not found"));

        List<LabReportItemResponse> items = new ArrayList<>();

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());
        for (MedicalRecord record : records) {
            for (MedicalFile file : medicalFileRepository.findByRecordId(record.getId())) {
                if (!"LAB_REPORT".equalsIgnoreCase(file.getCategory())) {
                    continue;
                }
                String role = file.getUploadedByRole() == null || file.getUploadedByRole().isBlank()
                    ? "DOCTOR"
                    : file.getUploadedByRole();
                String uploaderName = file.getUploadedByName();
                if ((uploaderName == null || uploaderName.isBlank()) && record.getDoctor() != null) {
                    uploaderName = (record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName()).trim();
                }

                items.add(LabReportItemResponse.builder()
                    .sourceType("RECORD")
                    .id(file.getId())
                    .linkedRecordId(record.getId())
                    .url(file.getUrl())
                    .fileType(file.getFileType())
                    .originalFileName(file.getOriginalFileName())
                    .uploadedByRole(role)
                    .uploadedByName(uploaderName)
                    .createdAt(file.getCreatedAt())
                    .recordDate(record.getRecordDate())
                    .diagnosis(record.getDiagnosis())
                    .doctorName(record.getDoctor() != null ? (record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName()).trim() : null)
                    .familyMemberId(record.getFamilyMember() != null ? record.getFamilyMember().getId() : null)
                    .familyMemberFirstName(record.getFamilyMember() != null ? record.getFamilyMember().getFirstName() : null)
                    .familyMemberLastName(record.getFamilyMember() != null ? record.getFamilyMember().getLastName() : null)
                    .familyMemberRelationship(record.getFamilyMember() != null ? record.getFamilyMember().getRelationship() : null)
                    .build());
            }
        }

        for (PatientLabReport report : patientLabReportRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())) {
            items.add(LabReportItemResponse.builder()
                .sourceType("PATIENT_INDEPENDENT")
                .id(report.getId())
                .linkedRecordId(null)
                .url(report.getUrl())
                .fileType(report.getFileType())
                .originalFileName(report.getOriginalFileName())
                .uploadedByRole(report.getUploadedByRole())
                .uploadedByName(report.getUploadedByName())
                .createdAt(report.getCreatedAt())
                .recordDate(null)
                .diagnosis(null)
                .doctorName(null)
                .familyMemberId(null)
                .familyMemberFirstName(null)
                .familyMemberLastName(null)
                .familyMemberRelationship(null)
                .build());
        }

        items.sort(Comparator.comparing(LabReportItemResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    public LabReportItemResponse uploadMine(User actor, MultipartFile file) throws IOException {
        if (actor.getRole().getName() != RoleName.PATIENT) {
            throw new BadRequestException("Only patients can upload independent lab reports");
        }

        FileValidator.validate(file);
        Patient patient = patientRepository.findByUserId(actor.getId())
            .orElseThrow(() -> new BadRequestException("Patient profile not found"));

        StorageResult uploadResult = localFileStorageService.store(file);

        PatientLabReport report = PatientLabReport.builder()
            .patient(patient)
            .url(uploadResult.getUrl())
            .publicId(uploadResult.getStorageKey())
            .fileType(file.getContentType())
            .originalFileName(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename())
            .uploadedByRole("PATIENT")
            .uploadedByName((patient.getFirstName() + " " + patient.getLastName()).trim())
            .createdAt(Instant.now())
            .build();

        @SuppressWarnings("null")
        PatientLabReport saved = patientLabReportRepository.save(report);

        return LabReportItemResponse.builder()
            .sourceType("PATIENT_INDEPENDENT")
            .id(saved.getId())
            .linkedRecordId(null)
            .url(saved.getUrl())
            .fileType(saved.getFileType())
            .originalFileName(saved.getOriginalFileName())
            .uploadedByRole(saved.getUploadedByRole())
            .uploadedByName(saved.getUploadedByName())
            .createdAt(saved.getCreatedAt())
            .recordDate(null)
            .diagnosis(null)
            .doctorName(null)
            .familyMemberId(null)
            .familyMemberFirstName(null)
            .familyMemberLastName(null)
            .familyMemberRelationship(null)
            .build();
    }
}
