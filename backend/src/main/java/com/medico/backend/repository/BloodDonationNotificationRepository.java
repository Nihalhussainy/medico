package com.medico.backend.repository;

import com.medico.backend.entity.BloodDonationNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BloodDonationNotificationRepository extends JpaRepository<BloodDonationNotification, Long> {
    List<BloodDonationNotification> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    Optional<BloodDonationNotification> findByRequestIdAndPatientId(Long requestId, Long patientId);
    List<BloodDonationNotification> findByRequestIdAndResponseEquals(Long requestId, String response);
}
