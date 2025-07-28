package com.example.career_portal.controller;

import com.example.career_portal.config.JwtUtil;
import com.example.career_portal.dto.RegisterRequest;
import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.entity.User;
import com.example.career_portal.service.ApplicantDetailsService;
import com.example.career_portal.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ApplicantDetailsService applicantDetailsService;

    @Autowired
    public AuthController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserService userService,
            PasswordEncoder passwordEncoder,
            ApplicantDetailsService applicantDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.applicantDetailsService = applicantDetailsService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        logger.debug("Fetching details for authenticated user");
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

            Map<String, Object> userDetails = new HashMap<>();
            userDetails.put("fullName", user.getFullName());
            userDetails.put("email", user.getEmail());
            userDetails.put("role", user.getRole().name());
            userDetails.put("phone", user.getPhone() != null ? user.getPhone() : "");

            logger.info("Successfully fetched details for user: {}", email);
            return ResponseEntity.ok(userDetails);
        } catch (Exception e) {
            logger.error("Error fetching user details: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", "Failed to fetch user details: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest authRequest) {
        logger.debug("Login attempt for email: {}", authRequest.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = userService.findByEmail(authRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.isApproved());
            logger.info("Generated JWT for email: {}", authRequest.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for email: {}", authRequest.getEmail(), e);
            if (e.getMessage().contains("HR not approved")) {
                return ResponseEntity.status(403).body(Map.of("error", "HR account not approved: " + authRequest.getEmail()));
            }
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        } catch (Exception e) {
            logger.error("Unexpected error during login for email: {}", authRequest.getEmail(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/register/applicant")
    public ResponseEntity<Map<String, String>> registerApplicant(@Valid @RequestBody RegisterRequest request, BindingResult result) {
        logger.debug("Registering applicant with email: {}", request.getEmail());

        // Handle validation errors
        if (result.hasErrors()) {
            String errorMessage = result.getFieldErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            logger.warn("Validation errors: {}", errorMessage);
            return ResponseEntity.status(400).body(Map.of("error", errorMessage));
        }

        try {
            // Check if user already exists
            if (userService.findByEmail(request.getEmail()).isPresent()) {
                logger.warn("User with email {} already exists", request.getEmail());
                return ResponseEntity.status(400).body(Map.of("error", "User with this email already exists"));
            }

            // Create the user (this will also create ApplicantDetails)
            User user = userService.createUser(
                    request.getFullName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPhone(),
                    User.Role.APPLICANT
            );

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.isApproved());
            logger.info("Applicant registered successfully with email: {}", request.getEmail());

            // Return success response with a user-friendly message
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Registration successful! Welcome, " + user.getFullName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error registering applicant with email: {}", request.getEmail(), e);
            return ResponseEntity.status(400).body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/register/hr")
    public ResponseEntity<Map<String, String>> registerHr(@RequestBody UserRegistrationRequest request) {
        logger.debug("Registering HR with email: {}", request.getEmail());
        try {
            // Check if user already exists
            if (userService.findByEmail(request.getEmail()).isPresent()) {
                logger.warn("User with email {} already exists", request.getEmail());
                return ResponseEntity.status(400).body(Map.of("error", "User with this email already exists"));
            }

            User user = userService.createUser(
                    request.getFullName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPhone(),
                    User.Role.HR
            );
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.isApproved());
            logger.info("HR registered successfully, awaiting approval: {}", request.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "HR registered successfully, awaiting Super Admin approval");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error registering HR with email: {}", request.getEmail(), e);
            return ResponseEntity.status(400).body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/approve-hr/{hrId}")
    public ResponseEntity<String> approveHr(@PathVariable Long hrId, @RequestHeader("Authorization") String token) {
        String jwt = token.replace("Bearer ", "");
        String superAdminEmail = jwtUtil.extractEmail(jwt);
        logger.debug("Super Admin {} requesting HR approval for ID: {}", superAdminEmail, hrId);
        try {
            User approvedHr = userService.approveHr(hrId, superAdminEmail);
            logger.info("HR {} approved by Super Admin {}", approvedHr.getEmail(), superAdminEmail);
            return ResponseEntity.ok("HR " + approvedHr.getEmail() + " approved successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid HR approval request by {}: {}", superAdminEmail, e.getMessage());
            return ResponseEntity.status(400).body("Approval failed: " + e.getMessage());
        } catch (AccessDeniedException e) {
            logger.warn("Access denied for HR approval by {}: {}", superAdminEmail, e.getMessage());
            return ResponseEntity.status(403).body("Approval failed: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error approving HR ID {} by {}: {}", hrId, superAdminEmail, e);
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PutMapping("/update-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String phone) {
        logger.debug("Profile update request for authenticated user");
        try {
            User updatedUser = userService.updateUserProfile(password, phone);
            Map<String, Object> response = Map.of(
                    "userId", updatedUser.getId(),
                    "email", updatedUser.getEmail(),
                    "phone", updatedUser.getPhone() != null ? updatedUser.getPhone() : "",
                    "message", "Profile updated successfully"
            );
            logger.info("Profile updated successfully for user: {}", updatedUser.getEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.warn("Profile update failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestParam String email) {
        logger.debug("Forgot password request for email: {}", email);
        try {
            String token = userService.createPasswordResetToken(email);
            return ResponseEntity.ok(Map.of(
                    "message", "Use this token to reset your password",
                    "token", token
            ));
        } catch (Exception e) {
            logger.error("Failed to process forgot password request for email: {}", email, e);
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        logger.debug("Reset password request with token: {}", token);
        try {
            userService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Password reset successfully");
        } catch (Exception e) {
            logger.error("Failed to reset password with token: {}", token, e);
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }
}

class AuthRequest {
    private String email;
    private String password;
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

class UserRegistrationRequest {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}