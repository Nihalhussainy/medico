package com.medico.backend.service;

import com.medico.backend.dto.DoctorProfileResponse;
import com.medico.backend.dto.DoctorProfileUpdateRequest;
import com.medico.backend.entity.Doctor;
import com.medico.backend.entity.User;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.UserRepository;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    public DoctorProfileResponse uploadProfilePicture(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        Doctor doctor = doctorRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        try {
            byte[] fileBytes = file.getBytes();
            String base64Image = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(fileBytes);
            doctor.setProfilePictureUrl(base64Image);
            doctorRepository.save(doctor);
            return toDoctorProfileResponse(doctor);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload profile picture", e);
        }
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
            .profilePictureUrl(doctor.getProfilePictureUrl())
            .build();
    }
}

