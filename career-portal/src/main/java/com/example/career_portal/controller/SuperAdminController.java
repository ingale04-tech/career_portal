package com.example.career_portal.controller;


import com.example.career_portal.entity.*;
import com.example.career_portal.exception.UserDeletionException;
import com.example.career_portal.repository.JobApplicationRepository;
import com.example.career_portal.repository.JobPostingRepository;
import com.example.career_portal.repository.UserRepository;
import com.example.career_portal.service.UserService;
import com.example.career_portal.service.JobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class SuperAdminController {

    private static final Logger logger = LoggerFactory.getLogger(SuperAdminController.class);
    private static final String LOG_FILE_PATH = "logs/application.log";
    private static final String RESUME_UPLOAD_DIR = "uploads/resumes/";

    private final UserService userService;
    private final JobService jobService;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;



    @Autowired
    public SuperAdminController(
            UserService userService,
            JobService jobService,
            JobApplicationRepository jobApplicationRepository,
            UserRepository userRepository,
            JobPostingRepository jobPostingRepository) {
        this.userService = userService;
        this.jobService = jobService;
        this.jobApplicationRepository = jobApplicationRepository;
        this.userRepository = userRepository;
        this.jobPostingRepository = jobPostingRepository;
    }

    @GetMapping("/users/hr")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<User>> getHrUsers() {
        logger.debug("Super Admin fetching all HR users");
        List<User> hrUsers = userService.findAllUsers().stream()
                .filter(user -> user.getRole() == User.Role.HR)
                .toList();
        logger.info("Retrieved {} HR users", hrUsers.size());
        return ResponseEntity.ok(hrUsers);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        logger.debug("Super Admin fetching all users");
        List<User> users = userService.findAllUsers();
        logger.info("Retrieved {} users", users.size());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/approve-hr-super/{hrId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> approveHr(@PathVariable Long hrId) {
        logger.debug("Super Admin approving HR with ID: {}", hrId);
        String superAdminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User approvedHr = userService.approveHr(hrId, superAdminEmail);
        logger.info("HR with ID {} approved", hrId);
        return ResponseEntity.ok(approvedHr);
    }

    @PutMapping("/disable-user/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> disableUser(@PathVariable Long userId) {
        logger.debug("Super Admin disabling user with ID: {}", userId);
        String superAdminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.disableHr(userId, superAdminEmail);
        logger.info("User with ID {} disabled", userId);
        return ResponseEntity.ok(Map.of("message", "User disabled successfully"));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
        logger.debug("Super Admin deleting user with ID: {}", userId);
        Map<String, String> response = new HashMap<>();
        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (user.getRole() == User.Role.SUPER_ADMIN) {
                logger.warn("Cannot delete a Super Admin: ID {}", userId);
                response.put("error", "Cannot delete a Super Admin");
                return ResponseEntity.badRequest().body(response);
            }
            userService.deleteUser(userId);
            logger.info("User with ID {} deleted", userId);
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (UserDeletionException e) {
            logger.warn("Failed to delete user with ID {}: {}", userId, e.getMessage());
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response); // 409 Conflict
        } catch (Exception e) {
            logger.error("Error deleting user with ID {}: {}", userId, e.getMessage(), e);
            response.put("error", "Failed to delete user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }




    @GetMapping("/jobs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<JobPosting>> getAllJobs() {
        logger.debug("Super Admin fetching all jobs");
        List<JobPosting> jobs = jobService.getAllJobs();
        logger.info("Retrieved {} jobs", jobs.size());
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/applications")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<JobApplication>> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) List<Long> jobIds) {
        logger.info("Fetching job applications with filters - status: {}, jobIds: {}", status, jobIds);
        List<JobApplication> applications;

        if (jobIds != null && !jobIds.isEmpty() && status != null) {
            applications = jobApplicationRepository.findByJobIdInAndStatus(jobIds, status);
        } else if (jobIds != null && !jobIds.isEmpty()) {
            applications = jobApplicationRepository.findByJobIdIn(jobIds);
        } else if (status != null) {
            applications = jobApplicationRepository.findAll().stream()
                    .filter(app -> app.getStatus() == status)
                    .toList();
        } else {
            applications = jobApplicationRepository.findAll();
        }

        logger.info("Retrieved {} applications", applications.size());
        return ResponseEntity.ok(applications);
    }

    @PutMapping("/reopen-job/{jobId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> reopenJob(@PathVariable Long jobId) {
        logger.debug("Super Admin reopening job with ID: {}", jobId);
        try {
            jobService.reopenJob(jobId);
            logger.info("Job with ID {} reopened (status set to OPEN)", jobId);
            return ResponseEntity.ok(Map.of("message", "Job reopened successfully"));
        } catch (Exception e) {
            logger.error("Error reopening job with ID {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reopen job: " + e.getMessage()));
        }
    }

    @DeleteMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteJob(@PathVariable Long jobId) {
        logger.debug("Super Admin deleting job with ID: {}", jobId);
        try {
            JobPosting job = jobPostingRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found with ID: " + jobId));
            jobApplicationRepository.deleteByJobId(jobId);
            jobPostingRepository.delete(job);
            logger.info("Job with ID {} deleted along with its applications", jobId);
            return ResponseEntity.ok(Map.of("message", "Job and associated applications deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting job with ID {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete job: " + e.getMessage()));
        }
    }

    @PutMapping("/applications/{applicationId}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<JobApplication> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> statusUpdate) {
        logger.debug("Super Admin updating status for application ID: {}", applicationId);
        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(statusUpdate.get("status").toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status value: {}", statusUpdate.get("status"));
            return ResponseEntity.badRequest().body(null);
        }
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + applicationId));
        application.setStatus(newStatus);
        jobApplicationRepository.save(application);
        logger.info("Application ID {} status updated to {}", applicationId, newStatus);
        return ResponseEntity.ok(application);
    }

    @DeleteMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteApplication(@PathVariable Long applicationId) {
        logger.debug("Super Admin deleting application with ID: {}", applicationId);
        try {
            JobApplication application = jobApplicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found with ID: " + applicationId));
            jobApplicationRepository.delete(application);
            logger.info("Application with ID {} deleted", applicationId);
            return ResponseEntity.ok(Map.of("message", "Application deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting application with ID {}: {}", applicationId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete application: " + e.getMessage()));
        }
    }

    @PutMapping("/applications/{applicationId}/resume")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> updateResume(
            @PathVariable Long applicationId,
            @RequestParam("resume") MultipartFile resume) {
        logger.debug("Super Admin updating resume for application ID: {}", applicationId);
        try {
            JobApplication application = jobApplicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found with ID: " + applicationId));

            if (resume == null || resume.isEmpty()) {
                logger.error("Resume file is required for application ID: {}", applicationId);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Resume file is required"));
            }

            String resumeFileName = UUID.randomUUID().toString() + "-" + resume.getOriginalFilename();
            Path resumePath = Paths.get(RESUME_UPLOAD_DIR + resumeFileName);
            Files.createDirectories(resumePath.getParent());
            Files.write(resumePath, resume.getBytes());

            application.setResumeUrl("http://localhost:8080/resumes/" + resumeFileName);
            jobApplicationRepository.save(application);

            logger.info("Resume updated for application ID: {}", applicationId);
            return ResponseEntity.ok(Map.of("message", "Resume updated successfully", "resumeUrl", application.getResumeUrl()));
        } catch (Exception e) {
            logger.error("Error updating resume for application ID {}: {}", applicationId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to update resume: " + e.getMessage()));
        }
    }

    @GetMapping("/user-categories")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<String>> getUserCategories() {
        logger.info("Super Admin fetching distinct categories from job postings");
        List<String> categories = jobPostingRepository.findDistinctCategories();
        logger.info("Retrieved {} distinct job categories", categories.size());
        return ResponseEntity.ok(categories);
    }




    @GetMapping("/logs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<String> getLogs(@RequestParam(defaultValue = "100") int lines) {
        logger.debug("Super Admin fetching last {} lines of system logs", lines);
        Path logFilePath = Paths.get(LOG_FILE_PATH);
        try {
            if (!Files.exists(logFilePath)) {
                logger.warn("Log file not found at {}", LOG_FILE_PATH);
                return ResponseEntity.ok("No logs available.");
            }

            // Step 1: Calculate the total number of lines
            long totalLines = Files.lines(logFilePath).count();

            // Step 2: Read the lines again and skip to get the last 'lines' number of lines
            String lastLines = Files.lines(logFilePath)
                    .skip(Math.max(0, totalLines - lines))
                    .collect(Collectors.joining("\n"));

            logger.info("Successfully retrieved last {} lines from {}", lines, LOG_FILE_PATH);
            return ResponseEntity.ok(lastLines);
        } catch (Exception e) {
            logger.error("Error reading logs: {}", LOG_FILE_PATH, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve logs: " + e.getMessage());
        }
    }

    @PutMapping("/close-job/{jobId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> closeJob(@PathVariable Long jobId) {
        logger.debug("Super Admin closing job with ID: {}", jobId);
        try {
            jobService.closeJob(jobId);
            logger.info("Job with ID {} closed (status set to CLOSE)", jobId);
            return ResponseEntity.ok(Map.of("message", "Job closed successfully"));
        } catch (Exception e) {
            logger.error("Error closing job with ID {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to close job: " + e.getMessage()));
        }
    }
}