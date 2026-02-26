package com.medico.backend.service;

import com.medico.backend.dto.AdminDoctorResponse;
import com.medico.backend.dto.AdminPatientResponse;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.Patient;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.PatientRepository;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AdminService(
        DoctorRepository doctorRepository,
        PatientRepository patientRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    public List<AdminDoctorResponse> getDoctors(String hospitalName) {
        List<Doctor> doctors = (hospitalName == null || hospitalName.isBlank())
            ? doctorRepository.findAll()
            : doctorRepository.findByHospitalNameIgnoreCase(hospitalName.trim());

        return doctors.stream()
            .map(doctor -> AdminDoctorResponse.builder()
                .id(doctor.getId())
                .fullName(doctor.getFirstName() + " " + doctor.getLastName())
                .email(doctor.getUser().getEmail())
                .phoneNumber(doctor.getPhoneNumber())
                .specialization(doctor.getSpecialization())
                .hospitalName(doctor.getHospitalName())
                .build())
            .collect(Collectors.toList());
    }

    public List<AdminPatientResponse> getPatients() {
        List<Patient> patients = patientRepository.findAll();
        return patients.stream()
            .map(this::toPatientResponse)
            .collect(Collectors.toList());
    }

    private AdminPatientResponse toPatientResponse(Patient patient) {
        Integer age = null;
        LocalDate dob = patient.getDateOfBirth();
        if (dob != null) {
            age = Period.between(dob, LocalDate.now()).getYears();
        }
        return AdminPatientResponse.builder()
            .id(patient.getId())
            .fullName(patient.getFirstName() + " " + patient.getLastName())
            .age(age)
            .gender(patient.getGender())
            .phoneNumber(patient.getPhoneNumber())
            .bloodGroup(patient.getBloodGroup())
            .location(patient.getLocation())
            .build();
    }
}
