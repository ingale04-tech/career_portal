package com.example.career_portal.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class Test {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("newsuperpass"));
    }
}