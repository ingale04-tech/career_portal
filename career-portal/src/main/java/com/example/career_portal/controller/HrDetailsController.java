package com.example.career_portal.controller;

import com.example.career_portal.dto.HrDetailsRequest;
import com.example.career_portal.dto.HrDetailsResponse;
import com.example.career_portal.service.HrDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hr")
public class HrDetailsController {

    private static final Logger logger = LoggerFactory.getLogger(HrDetailsController.class);

    @Autowired
    private HrDetailsService hrDetailsService;

    @GetMapping("/details")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<HrDetailsResponse> getHrDetails(Authentication authentication) {
        String email = authentication.getName();
        logger.debug("Fetching HR details for email: {}", email);
        try {
            HrDetailsResponse hrDetails = hrDetailsService.getHrDetails(email);
            logger.info("HR details fetched successfully for email: {}", email);
            return ResponseEntity.ok(hrDetails);
        } catch (RuntimeException e) {
            logger.error("Error fetching HR details for email: {}", email, e);
            throw new RuntimeException("Failed to fetch HR details: " + e.getMessage());
        }
    }

    @PostMapping("/details")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Map<String, String>> createOrUpdateHrDetails(
            @RequestBody HrDetailsRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        logger.debug("Creating/Updating HR details for email: {}, companyName={}, designation={}",
                email, request.getCompanyName(), request.getDesignation());

        try {
            hrDetailsService.createOrUpdateHrDetails(email, request.getCompanyName(), request.getDesignation());
            logger.info("HR details created/updated successfully for email: {}", email);
            return ResponseEntity.ok(Map.of("message", "HR details created/updated successfully"));
        } catch (ObjectOptimisticLockingFailureException e) {
            logger.warn("Concurrent update detected for HR details of email: {}", email);
            return ResponseEntity.badRequest().body(Map.of("error", "Another update occurred. Please try again."));
        } catch (RuntimeException e) {
            logger.error("Error creating/updating HR details for email: {}", email, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}