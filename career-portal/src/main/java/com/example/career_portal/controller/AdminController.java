package com.example.career_portal.controller;

import com.example.career_portal.entity.User;
import com.example.career_portal.service.JobApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final JobApplicationService jobApplicationService;


    @Autowired
    public AdminController(JobApplicationService jobApplicationService) {
        this.jobApplicationService = jobApplicationService;
    }

    @PutMapping("/approve-hr/{hrId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> approveHr(
            @PathVariable Long hrId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = (userDetails != null) ? userDetails.getUsername() : "unknown";
        logger.debug("Received request to approve HR with ID: {} by Super Admin: {}", hrId, username);
        try {
            User approvedHr = jobApplicationService.approveHr(hrId);
            logger.info("HR with ID: {} approved successfully by Super Admin: {}", hrId, username);
            return ResponseEntity.ok(approvedHr);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request to approve HR: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error approving HR with ID: {} by Super Admin: {}", hrId, username, e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping("/disable-hr/{hrId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> disableHr(
            @PathVariable Long hrId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = (userDetails != null) ? userDetails.getUsername() : "unknown";
        logger.debug("Received request to disable HR with ID: {} by Super Admin: {}", hrId, username);
        try {
            User disabledHr = jobApplicationService.disableHr(hrId);
            logger.info("HR with ID: {} disabled successfully by Super Admin: {}", hrId, username);
            return ResponseEntity.ok(disabledHr);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request to disable HR: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error disabling HR with ID: {} by Super Admin: {}", hrId, username, e);
            return ResponseEntity.status(500).body(null);
        }
    }
}