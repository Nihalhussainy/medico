package com.medico.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "blood_donation_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodDonationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bloodGroup;

    @Column(nullable = false)
    private String hospitalName;

    @Column(nullable = false)
    private String patientName;

    @Column
    private String patientGender;

    @Column
    private Integer patientAge;

    @Column(nullable = false)
    private String contactNumber;

    @Column
    private String urgency; // CRITICAL, HIGH, NORMAL

    @Column(columnDefinition = "TEXT")
    private String reason; // Optional: emergency surgery, post-delivery, etc.

    @ManyToOne
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false)
    private Instant createdAt;

    @Column
    private Instant expiresAt; // When request expires (e.g., 24 hours)

    @Column
    private Boolean isActive;
}
