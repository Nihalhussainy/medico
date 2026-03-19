package com.medico.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicalFileResponse {
    private Long id;
    private String url;
    private String fileType;
    private String originalFileName;
    private String category;
    private String uploadedByRole;
    private String uploadedByName;
    private Instant createdAt;
}
