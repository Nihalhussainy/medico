package com.medico.backend.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsResponse {
    private Long totalPatients;
    private Double patientGrowthPercent;
    private Integer newPatientsThisMonth;

    private Integer totalVisitsThisMonth;
    private Integer totalVisitsLastMonth;
    private Double visitGrowthPercent;

    private List<VisitTrend> visitTrends;
    private Map<String, Long> patientsByGender;
    private Map<String, Long> patientsByAgeGroup;
    private Map<String, Long> patientsByBloodGroup;
    private List<DiagnosisCount> topDiagnoses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitTrend {
        private String month;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagnosisCount {
        private String category;
        private Long count;
    }
}
