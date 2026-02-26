package com.medico.backend.repository;

import com.medico.backend.entity.MedicalFile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalFileRepository extends JpaRepository<MedicalFile, Long> {
    List<MedicalFile> findByRecordId(Long recordId);
}
