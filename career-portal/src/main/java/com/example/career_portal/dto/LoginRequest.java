package com.example.career_portal.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}