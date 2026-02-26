package com.medico.backend.service;

import com.medico.backend.dto.DoctorProfileResponse;
import com.medico.backend.dto.DoctorProfileUpdateRequest;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.User;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    public DoctorProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Doctor doctor = doctorRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        
        return toDoctorProfileResponse(doctor);
    }

    public DoctorProfileResponse updateProfile(Long userId, DoctorProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Doctor doctor = doctorRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        
        doctor.setSpecialization(request.getSpecialization());
        doctor.setHospitalName(request.getHospitalName());
        
        doctorRepository.save(doctor);
        
        return toDoctorProfileResponse(doctor);
    }

    private DoctorProfileResponse toDoctorProfileResponse(Doctor doctor) {
        return DoctorProfileResponse.builder()
            .id(doctor.getId())
            .firstName(doctor.getFirstName())
            .lastName(doctor.getLastName())
            .phoneNumber(doctor.getPhoneNumber())
            .specialization(doctor.getSpecialization())
            .licenseNumber(doctor.getLicenseNumber())
            .hospitalName(doctor.getHospitalName())
            .build();
    }
}

