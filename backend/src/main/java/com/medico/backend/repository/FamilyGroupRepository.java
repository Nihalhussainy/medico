package com.medico.backend.repository;

import com.medico.backend.entity.FamilyGroup;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {
    Optional<FamilyGroup> findByOwnerPatientId(Long ownerPatientId);
}
