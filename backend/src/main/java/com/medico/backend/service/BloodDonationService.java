package com.medico.backend.service;

import com.medico.backend.dto.BloodDonationDonorResponse;
import com.medico.backend.dto.BloodDonationNotificationResponse;
import com.medico.backend.dto.BloodDonationRequestCreateRequest;
import com.medico.backend.dto.BloodDonationRequestResponse;
import com.medico.backend.entity.BloodDonationNotification;
import com.medico.backend.entity.BloodDonationRequest;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.User;
import com.medico.backend.exception.BadRequestException;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.BloodDonationNotificationRepository;
import com.medico.backend.repository.BloodDonationRequestRepository;
import com.medico.backend.repository.PatientRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class BloodDonationService {

    private final BloodDonationRequestRepository bloodRequestRepository;
    private final BloodDonationNotificationRepository notificationRepository;
    private final PatientRepository patientRepository;

    public BloodDonationService(
        BloodDonationRequestRepository bloodRequestRepository,
        BloodDonationNotificationRepository notificationRepository,
        PatientRepository patientRepository
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.notificationRepository = notificationRepository;
        this.patientRepository = patientRepository;
    }

    public BloodDonationRequestResponse createBloodRequest(
        BloodDonationRequestCreateRequest request,
        User admin
    ) {
        if (request.getBloodGroup() == null || request.getBloodGroup().isBlank()) {
            throw new BadRequestException("Blood group is required");
        }

        BloodDonationRequest bloodRequest = BloodDonationRequest.builder()
            .bloodGroup(request.getBloodGroup())
            .hospitalName(request.getHospitalName())
            .patientName(request.getPatientName())
            .patientGender(request.getPatientGender())
            .patientAge(request.getPatientAge())
            .contactNumber(request.getContactNumber())
            .urgency(request.getUrgency() != null ? request.getUrgency() : "NORMAL")
            .reason(request.getReason())
            .createdBy(admin)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
            .isActive(true)
            .build();

        BloodDonationRequest saved = bloodRequestRepository.save(bloodRequest);

        // Create notifications for all patients with matching blood group
        List<Patient> matchingPatients = patientRepository.findByBloodGroup(request.getBloodGroup());
        for (Patient patient : matchingPatients) {
            BloodDonationNotification notification = BloodDonationNotification.builder()
                .request(saved)
                .patient(patient)
                .isSeen(false)
                .response("NO_RESPONSE")
                .createdAt(Instant.now())
                .build();
            notificationRepository.save(notification);
        }

        return toRequestResponse(saved, 0);
    }

    public List<BloodDonationRequestResponse> getAllActiveRequests() {
        List<BloodDonationRequest> requests = bloodRequestRepository.findAllByIsActiveTrueOrderByCreatedAtDesc();
        return requests.stream()
            .map(req -> {
                long interestedCount = notificationRepository.findByRequestIdAndResponseEquals(req.getId(), "INTERESTED").size();
                return toRequestResponse(req, (int) interestedCount);
            })
            .collect(Collectors.toList());
    }

    public List<BloodDonationNotificationResponse> getNotificationsForPatient(Long patientId) {
        List<BloodDonationNotification> notifications = notificationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return notifications.stream()
            .map(this::toNotificationResponse)
            .collect(Collectors.toList());
    }

    public BloodDonationNotificationResponse respondToNotification(
        Long notificationId,
        String response,
        Long patientId
    ) {
        BloodDonationNotification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("Not authorized to respond to this notification");
        }

        if (!response.equals("INTERESTED") && !response.equals("NOT_INTERESTED")) {
            throw new BadRequestException("Invalid response. Must be INTERESTED or NOT_INTERESTED");
        }

        notification.setResponse(response);
        notification.setRespondedAt(Instant.now());
        notification.setIsSeen(true);
        notification.setSeenAt(Instant.now());

        BloodDonationNotification saved = notificationRepository.save(notification);
        return toNotificationResponse(saved);
    }

    public BloodDonationNotificationResponse markAsSeen(Long notificationId, Long patientId) {
        BloodDonationNotification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("Not authorized");
        }

        notification.setIsSeen(true);
        notification.setSeenAt(Instant.now());
        BloodDonationNotification saved = notificationRepository.save(notification);
        return toNotificationResponse(saved);
    }

    public List<BloodDonationDonorResponse> getInterestedDonors(Long requestId) {
        List<BloodDonationNotification> interested = notificationRepository
            .findByRequestIdAndResponseEquals(requestId, "INTERESTED");
        return interested.stream()
            .map(notification -> toDonorResponse(notification.getPatient()))
            .collect(Collectors.toList());
    }

    public BloodDonationRequestResponse markRequestReceived(Long requestId) {
        BloodDonationRequest request = bloodRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        request.setIsActive(false);
        BloodDonationRequest saved = bloodRequestRepository.save(request);
        long interestedCount = notificationRepository.findByRequestIdAndResponseEquals(requestId, "INTERESTED").size();
        return toRequestResponse(saved, (int) interestedCount);
    }

    private BloodDonationRequestResponse toRequestResponse(BloodDonationRequest request, int interestedCount) {
        return BloodDonationRequestResponse.builder()
            .id(request.getId())
            .bloodGroup(request.getBloodGroup())
            .hospitalName(request.getHospitalName())
            .patientName(request.getPatientName())
            .patientGender(request.getPatientGender())
            .patientAge(request.getPatientAge())
            .contactNumber(request.getContactNumber())
            .urgency(request.getUrgency())
            .reason(request.getReason())
            .createdAt(request.getCreatedAt())
            .expiresAt(request.getExpiresAt())
            .isActive(request.getIsActive())
            .interestedCount(interestedCount)
            .build();
    }

    private BloodDonationNotificationResponse toNotificationResponse(BloodDonationNotification notification) {
        BloodDonationRequest req = notification.getRequest();
        return BloodDonationNotificationResponse.builder()
            .id(notification.getId())
            .requestId(req.getId())
            .bloodGroup(req.getBloodGroup())
            .hospitalName(req.getHospitalName())
            .patientName(req.getPatientName())
            .patientGender(req.getPatientGender())
            .patientAge(req.getPatientAge())
            .contactNumber(req.getContactNumber())
            .urgency(req.getUrgency())
            .reason(req.getReason())
            .isSeen(notification.getIsSeen())
            .response(notification.getResponse())
            .createdAt(notification.getCreatedAt())
            .build();
    }

    private BloodDonationDonorResponse toDonorResponse(Patient patient) {
        Integer age = null;
        LocalDate dob = patient.getDateOfBirth();
        if (dob != null) {
            age = Period.between(dob, LocalDate.now()).getYears();
        }
        return BloodDonationDonorResponse.builder()
            .patientId(patient.getId())
            .fullName(patient.getFirstName() + " " + patient.getLastName())
            .phoneNumber(patient.getPhoneNumber())
            .age(age)
            .gender(patient.getGender())
            .bloodGroup(patient.getBloodGroup())
            .location(patient.getLocation())
            .build();
    }
}
