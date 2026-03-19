package com.medico.backend.controller;

import com.medico.backend.dto.DashboardAnalyticsResponse;
import com.medico.backend.service.AnalyticsService;
import com.medico.backend.service.UserService;
import com.medico.backend.entity.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserService userService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DashboardAnalyticsResponse> getDashboardAnalytics() {
        var currentUser = userService.getCurrentUser();

        if (currentUser.getRole().getName() == RoleName.ADMIN) {
            // Admin sees all analytics
            DashboardAnalyticsResponse analytics = analyticsService.getDashboardAnalyticsForAdmin();
            return ResponseEntity.ok(analytics);
        } else {
            // Doctor sees only their own analytics
            var currentDoctor = userService.getCurrentDoctor();
            DashboardAnalyticsResponse analytics = analyticsService.getDashboardAnalyticsForDoctor(currentDoctor.getId());
            return ResponseEntity.ok(analytics);
        }
    }
}
