package com.medico.backend.repository;

import com.medico.backend.entity.OtpConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpConsentRepository extends JpaRepository<OtpConsent, Long> {
    Optional<OtpConsent> findTopByPatientIdAndDoctorIdOrderByIdDesc(Long patientId, Long doctorId);
    Optional<OtpConsent> findTopByPatientIdAndDoctorIdAndOtpCodeOrderByIdDesc(Long patientId, Long doctorId, String otpCode);
    
    Optional<OtpConsent> findTopByPatientPhoneNumberAndDoctorPhoneNumberOrderByIdDesc(String patientPhoneNumber, String doctorPhoneNumber);
    Optional<OtpConsent> findTopByPatientPhoneNumberAndDoctorPhoneNumberAndOtpCodeOrderByIdDesc(String patientPhoneNumber, String doctorPhoneNumber, String otpCode);
}
