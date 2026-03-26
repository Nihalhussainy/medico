package com.medico.backend.service;

import com.medico.backend.dto.MlInteractionRequest;
import com.medico.backend.dto.MlRecommendRequest;
import com.medico.backend.dto.MlRiskRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Proxy service that calls the Python FastAPI ML microservice.
 */
@Service
public class MlService {

    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlBaseUrl;

    public MlService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Check if ML service is reachable.
     */
    public Map<String, Object> healthCheck() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    mlBaseUrl + "/health", Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "unavailable");
            error.put("error", "ML service is not reachable: " + e.getMessage());
            return error;
        }
    }

    /**
     * Get medicine recommendations for a diagnosis.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> recommendMedicine(MlRecommendRequest request) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("disease", request.getDisease());
            body.put("age", request.getAge());
            body.put("gender", request.getGender());
            body.put("blood_group", request.getBloodGroup() != null ? request.getBloodGroup() : "O+");
            body.put("allergies", request.getAllergies() != null ? request.getAllergies() : List.of());
            body.put("top_k", request.getTopK() > 0 ? request.getTopK() : 5);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mlBaseUrl + "/recommend-medicine", entity, Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            return upstreamErrorResponse("Medicine recommendation failed", e);
        } catch (RestClientException e) {
            return errorResponse("Medicine recommendation failed", e);
        }
    }

    /**
     * Predict health risks from patient history.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> predictRisks(MlRiskRequest request) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("age", request.getAge());
            body.put("gender", request.getGender());
            body.put("blood_group", request.getBloodGroup() != null ? request.getBloodGroup() : "O+");

            List<Map<String, Object>> historyList = new ArrayList<>();
            if (request.getPatientHistory() != null) {
                for (MlRiskRequest.HistoryRecord h : request.getPatientHistory()) {
                    Map<String, Object> record = new HashMap<>();
                    record.put("disease", h.getDisease());
                    record.put("severity", h.getSeverity());
                    record.put("bp_systolic", h.getBpSystolic());
                    record.put("bp_diastolic", h.getBpDiastolic());
                    record.put("heart_rate", h.getHeartRate());
                    record.put("temperature", h.getTemperature());
                    record.put("spo2", h.getSpo2());
                    record.put("risk_factors", h.getRiskFactors());
                    record.put("is_chronic", h.isChronic());
                    historyList.add(record);
                }
            }
            body.put("patient_history", historyList);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mlBaseUrl + "/predict-risks", entity, Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            return upstreamErrorResponse("Risk prediction failed", e);
        } catch (RestClientException e) {
            return errorResponse("Risk prediction failed", e);
        }
    }

    /**
     * Check drug interactions for a list of medications.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> checkInteractions(MlInteractionRequest request) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("medications", request.getMedications());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mlBaseUrl + "/check-interactions", entity, Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            return upstreamErrorResponse("Drug interaction check failed", e);
        } catch (RestClientException e) {
            return errorResponse("Drug interaction check failed", e);
        }
    }

    /**
     * Get list of known diseases from ML service.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getDiseases() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    mlBaseUrl + "/diseases", Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            return errorResponse("Could not fetch disease list", e);
        }
    }

    private Map<String, Object> errorResponse(String message, RestClientException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("detail", e.getMessage());
        error.put("statusCode", HttpStatus.BAD_GATEWAY.value());
        error.put("ml_service_url", mlBaseUrl);
        return error;
    }

    private Map<String, Object> upstreamErrorResponse(String message, HttpStatusCodeException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("detail", e.getResponseBodyAsString());
        error.put("statusCode", e.getStatusCode().value());
        error.put("ml_service_url", mlBaseUrl);
        return error;
    }
}
