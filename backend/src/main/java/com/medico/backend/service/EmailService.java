package com.medico.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String deliveryMode;

    public EmailService(JavaMailSender mailSender, @Value("${app.otp.delivery}") String deliveryMode) {
        this.mailSender = mailSender;
        this.deliveryMode = deliveryMode;
    }

    public void sendOtpEmail(String to, String otp) {
        if (!"EMAIL".equalsIgnoreCase(deliveryMode)) {
            log.info("OTP delivery mode is {}, OTP for {} is {}", deliveryMode, to, otp);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Your Medical Consent OTP");
        message.setText("Your OTP is: " + otp + ". It expires soon.");
        mailSender.send(message);
    }

    public boolean isMock() {
        return !"EMAIL".equalsIgnoreCase(deliveryMode);
    }
}
