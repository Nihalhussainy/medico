package com.medico.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_lab_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientLabReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String publicId;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String uploadedByRole;

    @Column(nullable = false)
    private String uploadedByName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
