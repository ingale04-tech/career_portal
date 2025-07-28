package com.example.career_portal.service;

import com.example.career_portal.dto.LoginRequest;
import com.example.career_portal.dto.RegisterRequest;
import com.example.career_portal.entity.User;
import com.example.career_portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository; // Lowercase variable name

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User register(RegisterRequest request) { // Removed 'static'
        // Validate role
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        String roleUpper = request.getRole().toUpperCase();
        User.Role role;
        try {
            role = User.Role.valueOf(roleUpper);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) { // Use lowercase userRepository
            throw new RuntimeException("Email already in use: " + request.getEmail());
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setIsApproved(request.getRole().equalsIgnoreCase("HR") ? false : true);
        return userRepository.save(user); // Use lowercase userRepository
    }

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()) // Use lowercase userRepository
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));
        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return user;
        }
        throw new RuntimeException("Invalid credentials");
    }
}