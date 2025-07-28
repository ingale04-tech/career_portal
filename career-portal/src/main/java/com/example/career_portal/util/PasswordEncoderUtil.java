package com.example.career_portal.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class PasswordEncoderUtil {
    public static void main(String[] args) {
        System.out.println(new BCryptPasswordEncoder().encode("admin123"));
    }
}