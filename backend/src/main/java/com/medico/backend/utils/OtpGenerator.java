package com.medico.backend.utils;

import java.security.SecureRandom;

public final class OtpGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private OtpGenerator() {
    }

    public static String generateSixDigit() {
        int code = 1000 + RANDOM.nextInt(9000);
        return String.valueOf(code);
    }
}
