package com.medico.backend.repository;

import com.medico.backend.entity.PatientLabReport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientLabReportRepository extends JpaRepository<PatientLabReport, Long> {
    List<PatientLabReport> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
