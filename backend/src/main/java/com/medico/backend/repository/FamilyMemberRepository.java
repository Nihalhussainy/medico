package com.medico.backend.repository;

import com.medico.backend.entity.FamilyMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(Long familyGroupId);
    Optional<FamilyMember> findByIdAndFamilyGroupIdAndIsActiveTrue(Long memberId, Long familyGroupId);

    @Query("SELECT fm FROM FamilyMember fm WHERE fm.familyGroup.ownerPatientId IN :patientIds AND fm.isActive = true")
    List<FamilyMember> findByOwnerPatientIdInAndIsActiveTrue(@Param("patientIds") java.util.Collection<Long> patientIds);
}
