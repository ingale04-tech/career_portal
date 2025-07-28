package com.example.career_portal.controller;

import com.example.career_portal.entity.JobPosting;
import com.example.career_portal.entity.User;
import com.example.career_portal.exception.UserDeletionException;
import com.example.career_portal.service.JobService;
import com.example.career_portal.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminMvcController {

    private static final Logger logger = LoggerFactory.getLogger(SuperAdminMvcController.class);

    private final JobService jobService;
    private final UserService userService;

    @Autowired
    public SuperAdminMvcController(JobService jobService, UserService userService) {
        this.jobService = jobService;
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public String superAdminDashboard(Model model) {
        logger.debug("Loading Super Admin Dashboard");
        try {
            List<User> users = userService.findAllUsers();
            model.addAttribute("users", users);
            logger.info("Loaded {} users for Super Admin Dashboard", users.size());
        } catch (Exception e) {
            logger.error("Error loading users for Super Admin Dashboard: {}", e.getMessage(), e);
            model.addAttribute("error", "Failed to load users: " + e.getMessage());
        }
        return "super-admin-dashboard";
    }

    @PostMapping("/delete-user/{userId}")
    public String deleteUser(
            @PathVariable Long userId,
            Model model,
            RedirectAttributes redirectAttributes) {
        logger.debug("Deleting user ID: {}", userId);
        try {
            userService.deleteUser(userId);
            logger.info("User ID {} deleted successfully", userId);
            redirectAttributes.addFlashAttribute("success", "User deleted successfully");
            return "redirect:/super-admin/dashboard";
        } catch (UserDeletionException e) {
            logger.warn("Failed to delete user ID: {} - {}", userId, e.getMessage());
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/super-admin/dashboard";
        } catch (Exception e) {
            logger.error("Unexpected error while deleting user ID: {}", userId, e);
            redirectAttributes.addFlashAttribute("error", "An unexpected error occurred: " + e.getMessage());
            return "redirect:/super-admin/dashboard";
        }
    }


    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
        logger.debug("Super Admin deleting user with ID: {}", userId);
        Map<String, String> response = new HashMap<>();
        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.deleteUser(userId);
            logger.info("User with ID {} deleted", userId);
            response.put("message", "Applicant deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error deleting user with ID {}: {}", userId, e.getMessage(), e);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error deleting user with ID {}: {}", userId, e.getMessage(), e);
            response.put("error", "Failed to delete user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/user/{userId}/jobs")
    public String viewUserJobs(@PathVariable Long userId, Model model) {
        logger.debug("Viewing jobs for user ID: {}", userId);
        try {
            List<JobPosting> jobs = jobService.findJobsByHrId(userId);
            model.addAttribute("jobs", jobs);
            model.addAttribute("userId", userId);
            logger.info("Loaded {} jobs for user ID: {}", jobs.size(), userId);
        } catch (Exception e) {
            logger.error("Error loading jobs for user ID: {} - {}", userId, e.getMessage(), e);
            model.addAttribute("error", "Failed to load jobs: " + e.getMessage());
            model.addAttribute("userId", userId);
        }
        return "user-jobs";
    }

    @PostMapping("/delete-job/{jobId}")
    public String deleteJob(
            @PathVariable Long jobId,
            @RequestParam Long userId,
            Model model,
            RedirectAttributes redirectAttributes) {
        logger.debug("Deleting job ID: {}", jobId);
        try {
            jobService.deleteJob(jobId);
            logger.info("Job ID {} deleted successfully", jobId);
            redirectAttributes.addFlashAttribute("success", "Job deleted successfully");
            return "redirect:/super-admin/user/" + userId + "/jobs";
        } catch (Exception e) {
            logger.error("Failed to delete job ID: {} - {}", jobId, e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "Failed to delete job: " + e.getMessage());
            return "redirect:/super-admin/user/" + userId + "/jobs";
        }
    }
}