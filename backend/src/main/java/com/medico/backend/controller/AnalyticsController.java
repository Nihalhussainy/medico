package com.medico.backend.controller;

import com.medico.backend.dto.DashboardAnalyticsResponse;
import com.medico.backend.service.AnalyticsService;
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

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DashboardAnalyticsResponse> getDashboardAnalytics() {
        DashboardAnalyticsResponse analytics = analyticsService.getDashboardAnalytics();
        return ResponseEntity.ok(analytics);
    }
}
