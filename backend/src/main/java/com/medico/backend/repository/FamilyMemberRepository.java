package com.medico.backend.repository;

import com.medico.backend.entity.FamilyMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(Long familyGroupId);
    Optional<FamilyMember> findByIdAndFamilyGroupIdAndIsActiveTrue(Long memberId, Long familyGroupId);
}
