package com.medico.backend.repository;

import com.medico.backend.entity.Doctor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByPhoneNumber(String phoneNumber);
    List<Doctor> findByHospitalNameIgnoreCase(String hospitalName);
}
