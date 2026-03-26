package com.medico.backend.controller;

import com.medico.backend.dto.MlInteractionRequest;
import com.medico.backend.dto.MlRecommendRequest;
import com.medico.backend.dto.MlRiskRequest;
import com.medico.backend.service.MlService;
import org.springframework.http.HttpStatusCode;
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
        return fromMlResponse(mlService.recommendMedicine(request));
    }

    @PostMapping("/predict-risks")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    public ResponseEntity<Map<String, Object>> predictRisks(
            @RequestBody MlRiskRequest request) {
        return fromMlResponse(mlService.predictRisks(request));
    }

    @PostMapping("/check-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> checkInteractions(
            @RequestBody MlInteractionRequest request) {
        return fromMlResponse(mlService.checkInteractions(request));
    }

    private ResponseEntity<Map<String, Object>> fromMlResponse(Map<String, Object> response) {
        Object statusCode = response.get("statusCode");
        if (statusCode instanceof Number code && code.intValue() >= 400) {
            return ResponseEntity.status(HttpStatusCode.valueOf(code.intValue())).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
