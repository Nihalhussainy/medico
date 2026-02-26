package com.medico.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MlRiskRequest {
    private List<HistoryRecord> patientHistory;
    private int age;
    private String gender;
    private String bloodGroup;

    @Getter
    @Setter
    public static class HistoryRecord {
        private String disease;
        private String severity = "MODERATE";
        private double bpSystolic = 120;
        private double bpDiastolic = 80;
        private double heartRate = 80;
        private double temperature = 98.6;
        private double spo2 = 97;
        private String riskFactors = "";
        private boolean isChronic = false;
    }
}
