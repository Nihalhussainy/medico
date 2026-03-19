package com.medico.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String deliveryMode;
    private final int otpExpiryMinutes;

    public EmailService(
        JavaMailSender mailSender,
        @Value("${app.otp.delivery}") String deliveryMode,
        @Value("${app.otp.expiration-minutes}") int otpExpiryMinutes
    ) {
        this.mailSender = mailSender;
        this.deliveryMode = deliveryMode;
        this.otpExpiryMinutes = otpExpiryMinutes;
    }

    public void sendOtpEmail(String to, String otp, String doctorName) {
        if (!"EMAIL".equalsIgnoreCase(deliveryMode)) {
            log.info("OTP delivery mode is {}, OTP for {} is {}", deliveryMode, to, otp);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Medical Record Access Request - Your OTP Code");
            helper.setText(buildOtpEmailHtml(otp, doctorName), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}", to, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    private String buildOtpEmailHtml(String otp, String doctorName) {
        String[] otpDigits = otp.split("");
        StringBuilder otpBoxes = new StringBuilder();
        for (String digit : otpDigits) {
            otpBoxes.append(String.format(
                "<span style=\"display:inline-block;width:40px;height:48px;margin:0 4px;background:#f8fafc;border:2px dashed #0d9488;border-radius:8px;font-size:24px;font-weight:700;line-height:44px;text-align:center;color:#0f766e;\">%s</span>",
                digit
            ));
        }

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:40px 20px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background:linear-gradient(135deg,#0d9488 0%%,#0f766e 100%%);padding:32px 24px;text-align:center;">
                                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center">
                                                    <div style="display:inline-block;width:48px;height:48px;background:#ffffff;border-radius:12px;line-height:48px;font-size:24px;font-weight:700;color:#0d9488;">M</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding-top:12px;">
                                                    <span style="color:#ffffff;font-size:20px;font-weight:600;">Medico</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding:32px 24px;">
                                        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;text-align:center;">Record Access Request</h1>
                                        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;line-height:1.5;">
                                            <strong style="color:#374151;">Dr. %s</strong> is requesting access to your medical records. Please share the verification code below to grant access.
                                        </p>
                                        <!-- OTP Box -->
                                        <div style="text-align:center;padding:24px 0;">
                                            %s
                                        </div>
                                        <!-- Expiry -->
                                        <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-align:center;">
                                            Expires in <strong style="color:#f59e0b;">%d minutes</strong>
                                        </p>
                                        <!-- Warning -->
                                        <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
                                            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                                                <strong>Security Notice:</strong> Never share this code with anyone who contacts you unexpectedly. Medico staff will never ask for your OTP.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                                        <p style="margin:0;font-size:12px;color:#9ca3af;">
                                            This is an automated message from Medico Healthcare Platform.<br>
                                            Please do not reply to this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(doctorName, otpBoxes.toString(), otpExpiryMinutes);
    }

    public boolean isMock() {
        return !"EMAIL".equalsIgnoreCase(deliveryMode);
    }
}
