package com.medico.backend.controller;

import com.medico.backend.dto.MlInteractionRequest;
import com.medico.backend.dto.MlRecommendRequest;
import com.medico.backend.dto.MlRiskRequest;
import com.medico.backend.service.MlService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ML endpoints that proxy to the Python ML microservice.
 * Only authenticated users (primarily doctors) can access these.
 */
@RestController
@RequestMapping("/api/ml")
public class MlController {

    private final MlService mlService;

    public MlController(MlService mlService) {
        this.mlService = mlService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(mlService.healthCheck());
    }

    @GetMapping("/diseases")
    public ResponseEntity<Map<String, Object>> listDiseases() {
        return ResponseEntity.ok(mlService.getDiseases());
    }

    @PostMapping("/recommend")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> recommendMedicine(
            @RequestBody MlRecommendRequest request) {
        return ResponseEntity.ok(mlService.recommendMedicine(request));
    }

    @PostMapping("/predict-risks")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> predictRisks(
            @RequestBody MlRiskRequest request) {
        return ResponseEntity.ok(mlService.predictRisks(request));
    }

    @PostMapping("/check-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> checkInteractions(
            @RequestBody MlInteractionRequest request) {
        return ResponseEntity.ok(mlService.checkInteractions(request));
    }
}
