package com.medico.backend.dto;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FamilyGroupResponse {
    private Long id;
    private String familyName;
    private Instant createdAt;
    private List<FamilyMemberResponse> members;
}
