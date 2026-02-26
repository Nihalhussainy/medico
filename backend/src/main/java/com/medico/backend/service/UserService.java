package com.medico.backend.service;

import com.medico.backend.entity.User;
import com.medico.backend.exception.ResourceNotFoundException;
import com.medico.backend.entity.Patient;
import com.medico.backend.entity.Doctor;
import com.medico.backend.repository.PatientRepository;
import com.medico.backend.repository.DoctorRepository;
import com.medico.backend.repository.UserRepository;
import com.medico.backend.utils.SecurityUtil;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public UserService(UserRepository userRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Patient getCurrentPatient() {
        User user = getCurrentUser();
        return patientRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    public Doctor getCurrentDoctor() {
        User user = getCurrentUser();
        return doctorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }
}
