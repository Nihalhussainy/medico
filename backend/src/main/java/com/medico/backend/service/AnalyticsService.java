package com.medico.backend.service;

import com.medico.backend.dto.DashboardAnalyticsResponse;
import com.medico.backend.dto.DashboardAnalyticsResponse.DiagnosisCount;
import com.medico.backend.dto.DashboardAnalyticsResponse.VisitTrend;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.MedicalRecord;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.FamilyMember;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.repository.MedicalRecordRepository;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.FamilyMemberRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;
    private final FamilyMemberRepository familyMemberRepository;

    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getDashboardAnalyticsForAdmin() {
        List<Patient> allPatients = patientRepository.findAll();
        List<MedicalRecord> allRecords = medicalRecordRepository.findAll();
        List<FamilyMember> allFamilyMembers = familyMemberRepository.findAll();
        return buildAnalytics(allPatients, allRecords, allFamilyMembers);
    }

    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getDashboardAnalyticsForDoctor(Long doctorId) {
        // Get all records created by this doctor
        List<MedicalRecord> doctorRecords = medicalRecordRepository.findByDoctorId(doctorId);

        // Get unique patients from those records
        Set<Long> patientIds = doctorRecords.stream()
            .map(r -> r.getPatient().getId())
            .collect(Collectors.toSet());

        List<Patient> doctorPatients = patientRepository.findAll().stream()
            .filter(p -> patientIds.contains(p.getId()))
            .collect(Collectors.toList());

        // Get family members of the doctor's patients
        List<FamilyMember> doctorFamilyMembers = familyMemberRepository.findByOwnerPatientIdInAndIsActiveTrue(patientIds);

        return buildAnalytics(doctorPatients, doctorRecords, doctorFamilyMembers);
    }

    private DashboardAnalyticsResponse buildAnalytics(List<Patient> patients, List<MedicalRecord> records, List<FamilyMember> familyMembers) {
        Instant now = Instant.now();
        Instant oneMonthAgo = now.minus(30, ChronoUnit.DAYS);
        Instant twoMonthsAgo = now.minus(60, ChronoUnit.DAYS);

        // Total patients
        long totalPatients = patients.size();

        // New patients this month
        int newPatientsThisMonth = (int) patients.stream()
                .filter(p -> p.getUser() != null && p.getUser().getCreatedAt() != null)
                .filter(p -> p.getUser().getCreatedAt().isAfter(oneMonthAgo))
                .count();

        // New patients last month
        int newPatientsLastMonth = (int) patients.stream()
                .filter(p -> p.getUser() != null && p.getUser().getCreatedAt() != null)
                .filter(p -> p.getUser().getCreatedAt().isAfter(twoMonthsAgo)
                        && p.getUser().getCreatedAt().isBefore(oneMonthAgo))
                .count();

        // Patient growth percentage
        double patientGrowthPercent = newPatientsLastMonth > 0
                ? ((double) (newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100
                : newPatientsThisMonth > 0 ? 100.0 : 0.0;

        // Visits this month
        int totalVisitsThisMonth = (int) records.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(oneMonthAgo))
                .count();

        // Visits last month
        int totalVisitsLastMonth = (int) records.stream()
                .filter(r -> r.getCreatedAt() != null
                        && r.getCreatedAt().isAfter(twoMonthsAgo)
                        && r.getCreatedAt().isBefore(oneMonthAgo))
                .count();

        // Visit growth percentage
        double visitGrowthPercent = totalVisitsLastMonth > 0
                ? ((double) (totalVisitsThisMonth - totalVisitsLastMonth) / totalVisitsLastMonth) * 100
                : totalVisitsThisMonth > 0 ? 100.0 : 0.0;

        // Visit trends (last 6 months)
        List<VisitTrend> visitTrends = calculateVisitTrends(records, 6);

        // Patients by gender
        Map<String, Long> patientsByGender = patients.stream()
                .filter(p -> p.getGender() != null && !p.getGender().isEmpty())
                .collect(Collectors.groupingBy(Patient::getGender, Collectors.counting()));

        // Patients by age group
        Map<String, Long> patientsByAgeGroup = calculateAgeGroups(patients);

        // Patients by blood group (including family members)
        Map<String, Long> patientsByBloodGroup = calculateBloodGroupDistribution(patients, familyMembers);

        // Top diagnoses
        List<DiagnosisCount> topDiagnoses = calculateTopDiagnoses(records, 10);

        return DashboardAnalyticsResponse.builder()
                .totalPatients(totalPatients)
                .patientGrowthPercent(patientGrowthPercent)
                .newPatientsThisMonth(newPatientsThisMonth)
                .totalVisitsThisMonth(totalVisitsThisMonth)
                .totalVisitsLastMonth(totalVisitsLastMonth)
                .visitGrowthPercent(visitGrowthPercent)
                .visitTrends(visitTrends)
                .patientsByGender(patientsByGender)
                .patientsByAgeGroup(patientsByAgeGroup)
                .patientsByBloodGroup(patientsByBloodGroup)
                .topDiagnoses(topDiagnoses)
                .build();
    }

    private Map<String, Long> calculateBloodGroupDistribution(List<Patient> patients, List<FamilyMember> familyMembers) {
        Map<String, Long> bloodGroupMap = new HashMap<>();

        // Add patients' blood groups
        patients.stream()
                .filter(p -> p.getBloodGroup() != null && !p.getBloodGroup().isEmpty())
                .forEach(p -> bloodGroupMap.put(p.getBloodGroup(), bloodGroupMap.getOrDefault(p.getBloodGroup(), 0L) + 1));

        // Add family members' blood groups
        familyMembers.stream()
                .filter(fm -> fm.getBloodGroup() != null && !fm.getBloodGroup().isEmpty())
                .forEach(fm -> bloodGroupMap.put(fm.getBloodGroup(), bloodGroupMap.getOrDefault(fm.getBloodGroup(), 0L) + 1));

        return bloodGroupMap;
    }

    private List<VisitTrend> calculateVisitTrends(List<MedicalRecord> records, int months) {
        Map<YearMonth, Long> trendMap = records.stream()
                .filter(r -> r.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        r -> YearMonth.from(r.getCreatedAt().atZone(ZoneId.systemDefault())),
                        Collectors.counting()
                ));

        YearMonth current = YearMonth.now();
        List<VisitTrend> trends = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            long count = trendMap.getOrDefault(month, 0L);
            String monthStr = month.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            trends.add(VisitTrend.builder().month(monthStr).count(count).build());
        }

        return trends;
    }

    private Map<String, Long> calculateAgeGroups(List<Patient> patients) {
        Map<String, Long> ageGroups = new LinkedHashMap<>();
        ageGroups.put("0-18", 0L);
        ageGroups.put("19-35", 0L);
        ageGroups.put("36-50", 0L);
        ageGroups.put("51-65", 0L);
        ageGroups.put("65+", 0L);

        LocalDate now = LocalDate.now();

        for (Patient patient : patients) {
            if (patient.getDateOfBirth() == null) continue;

            int age = (int) ChronoUnit.YEARS.between(patient.getDateOfBirth(), now);

            String group;
            if (age < 19) group = "0-18";
            else if (age < 36) group = "19-35";
            else if (age < 51) group = "36-50";
            else if (age < 66) group = "51-65";
            else group = "65+";

            ageGroups.put(group, ageGroups.get(group) + 1);
        }

        return ageGroups;
    }

    private List<DiagnosisCount> calculateTopDiagnoses(List<MedicalRecord> records, int limit) {
        Map<String, Long> diagnosisCounts = records.stream()
                .filter(r -> r.getDiagnosis() != null && !r.getDiagnosis().trim().isEmpty())
                .map(r -> r.getDiagnosis().trim())
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        return diagnosisCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(e -> DiagnosisCount.builder()
                        .category(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
