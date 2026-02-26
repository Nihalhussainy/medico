package com.medico.backend.repository;

import com.medico.backend.entity.BloodDonationRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BloodDonationRequestRepository extends JpaRepository<BloodDonationRequest, Long> {
    List<BloodDonationRequest> findAllByBloodGroupAndIsActiveTrue(String bloodGroup);
    List<BloodDonationRequest> findAllByIsActiveTrueOrderByCreatedAtDesc();
}
