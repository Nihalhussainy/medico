package com.medico.backend.controller;

import com.medico.backend.dto.BloodDonationDonorResponse;
import com.medico.backend.dto.BloodDonationNotificationResponse;
import com.medico.backend.dto.BloodDonationRequestCreateRequest;
import com.medico.backend.dto.BloodDonationRequestResponse;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.User;
import com.medico.backend.service.BloodDonationService;
import com.medico.backend.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blood-donation")
public class BloodDonationController {

    private final BloodDonationService bloodDonationService;
    private final UserService userService;

    public BloodDonationController(BloodDonationService bloodDonationService, UserService userService) {
        this.bloodDonationService = bloodDonationService;
        this.userService = userService;
    }

    /**
     * Admin creates a blood donation request for a specific blood group
     * Automatically notifies all patients with that blood group
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/request")
    public ResponseEntity<BloodDonationRequestResponse> createBloodRequest(
        @RequestBody BloodDonationRequestCreateRequest request
    ) {
        User admin = userService.getCurrentUser();
        BloodDonationRequestResponse response = bloodDonationService.createBloodRequest(request, admin);
        return ResponseEntity.ok(response);
    }

    /**
     * Admin views all active blood donation requests with interested donor count
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/requests")
    public ResponseEntity<List<BloodDonationRequestResponse>> getAllRequests() {
        List<BloodDonationRequestResponse> requests = bloodDonationService.getAllActiveRequests();
        return ResponseEntity.ok(requests);
    }

    /**
     * Admin views interested donors for a specific request
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/requests/{requestId}/donors")
    public ResponseEntity<List<BloodDonationDonorResponse>> getInterestedDonors(
        @PathVariable Long requestId
    ) {
        List<BloodDonationDonorResponse> donors = bloodDonationService.getInterestedDonors(requestId);
        return ResponseEntity.ok(donors);
    }

    /**
     * Admin marks a request as received/fulfilled
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/requests/{requestId}/received")
    public ResponseEntity<BloodDonationRequestResponse> markRequestReceived(
        @PathVariable Long requestId
    ) {
        BloodDonationRequestResponse response = bloodDonationService.markRequestReceived(requestId);
        return ResponseEntity.ok(response);
    }

    /**
     * Patient gets their blood donation notifications
     */
    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/notifications")
    public ResponseEntity<List<BloodDonationNotificationResponse>> getNotifications() {
        Patient patient = userService.getCurrentPatient();
        List<BloodDonationNotificationResponse> notifications = bloodDonationService.getNotificationsForPatient(patient.getId());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Patient marks notification as seen
     */
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/notifications/{notificationId}/seen")
    public ResponseEntity<BloodDonationNotificationResponse> markAsSeen(
        @PathVariable Long notificationId
    ) {
        Patient patient = userService.getCurrentPatient();
        BloodDonationNotificationResponse response = bloodDonationService.markAsSeen(notificationId, patient.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Patient responds to a blood donation notification (INTERESTED or NOT_INTERESTED)
     */
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/notifications/{notificationId}/respond")
    public ResponseEntity<BloodDonationNotificationResponse> respondToNotification(
        @PathVariable Long notificationId,
        @RequestBody Map<String, String> body
    ) {
        Patient patient = userService.getCurrentPatient();
        String response = body.get("response");
        BloodDonationNotificationResponse notifResponse = bloodDonationService.respondToNotification(
            notificationId,
            response,
            patient.getId()
        );
        return ResponseEntity.ok(notifResponse);
    }
}
