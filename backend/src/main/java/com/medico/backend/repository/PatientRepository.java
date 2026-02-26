package com.medico.backend.repository;

import com.medico.backend.entity.Patient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByPhoneNumber(String phoneNumber);
    List<Patient> findByBloodGroup(String bloodGroup);
}
