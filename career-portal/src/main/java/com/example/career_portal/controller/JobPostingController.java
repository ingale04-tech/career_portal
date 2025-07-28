package com.example.career_portal.controller;

import com.example.career_portal.dto.JobPostingDTO;
import com.example.career_portal.entity.JobPosting;
import com.example.career_portal.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/jobs")
public class JobPostingController {

    private static final Logger logger = LoggerFactory.getLogger(JobPostingController.class);
    private final JobService jobService;

    public JobPostingController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping(value = "/create", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> createJob(
            @RequestPart("job") String jobJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Received request to create job by HR: {}", hrEmail);
        try {
            if (jobJson == null) {
                logger.warn("Job JSON is null in createJob request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job details cannot be null"));
            }

            ObjectMapper objectMapper = new ObjectMapper();
            JobPosting job = objectMapper.readValue(jobJson, JobPosting.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                Path targetLocation = Paths.get("uploads/" + fileName);
                Files.createDirectories(targetLocation.getParent());
                Files.copy(imageFile.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                String imageUrl = "http://localhost:8080/uploads/" + fileName;
                job.setImageUrl(imageUrl);
                logger.info("Image uploaded for job by HR: {}, URL: {}", hrEmail, imageUrl);
            } else {
                job.setImageUrl("https://via.placeholder.com/300x200?text=Default+Job+Image");
                logger.info("No image uploaded for job by HR: {}, using default image", hrEmail);
            }

            JobPostingDTO createdJob = jobService.createJob(job, hrEmail);
            logger.info("Job created successfully with ID: {} by HR: {}", createdJob.getId(), hrEmail);
            return ResponseEntity.ok(createdJob);
        } catch (IOException e) {
            logger.error("Failed to upload image for job by HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Failed to create job for HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllJobs() {
        String user = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : "anonymous";
        logger.info("User accessing /api/jobs/all: {}", user);
        try {
            List<JobPostingDTO> jobs = jobService.getAllJobsForApplicants();
            logger.info("Retrieved {} jobs for user: {}", jobs.size(), user);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            logger.error("Failed to retrieve jobs for user: {}: {}", user, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve jobs: " + e.getMessage()));
        }
    }

    // In JobPostingController.java
    // In JobPostingController.java
    @GetMapping("/my-jobs")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> getMyJobs(
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", required = false) String status
    ) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching jobs for HR: {} with filters - title: {}, location: {}, category: {}, status: {}",
                hrEmail, title, location, category, status);
        try {
            List<JobPostingDTO> jobs = jobService.getJobsByHr(hrEmail, title, location, category, status);
            logger.debug("Retrieved {} jobs for HR: {}", jobs.size(), hrEmail);
            return ResponseEntity.ok(jobs);
        } catch (RuntimeException e) {
            logger.error("Failed to fetch jobs for HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> updateJob(
            @PathVariable Long id,
            @RequestPart("job") String jobJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Received request to update job with ID: {} by HR: {}", id, hrEmail);
        try {
            if (id == null) {
                logger.warn("Job ID is null in updateJob request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            if (jobJson == null) {
                logger.warn("Job details are null in updateJob request for jobId: {} by HR: {}", id, hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job details cannot be null"));
            }

            // Parse the job JSON string into a JobPosting object
            ObjectMapper objectMapper = new ObjectMapper();
            JobPosting jobDetails = objectMapper.readValue(jobJson, JobPosting.class);

            // Handle image upload
            String imageUrl = null;
            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                Path targetLocation = Paths.get("uploads/" + fileName);
                Files.createDirectories(targetLocation.getParent());
                Files.copy(imageFile.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                imageUrl = "http://localhost:8080/uploads/" + fileName;
                logger.info("Image uploaded for job update by HR: {}, URL: {}", hrEmail, imageUrl);
            }

            JobPostingDTO updatedJob = jobService.updateJob(id, jobDetails, hrEmail, imageUrl);
            logger.info("Job with ID: {} updated successfully by HR: {}", id, hrEmail);
            return ResponseEntity.ok(updatedJob);
        } catch (IOException e) {
            logger.error("Failed to upload image for job update by HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Failed to update job with ID: {} for HR: {}: {}", id, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Received request to delete job with ID: {} by HR: {}", id, hrEmail);
        try {
            if (id == null) {
                logger.warn("Job ID is null in deleteJob request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            jobService.deleteJob(id, hrEmail);
            logger.info("Job with ID: {} deleted successfully by HR: {}", id, hrEmail);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete job with ID: {} for HR: {}: {}", id, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @PutMapping("/toggle-status/{jobId}")
    @PreAuthorize("hasAnyRole('ROLE_HR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> toggleJobStatus(@PathVariable Long jobId) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("User {} toggling status for job with ID: {}", userEmail, jobId);
        try {
            if (jobId == null) {
                logger.warn("Job ID is null in toggleJobStatus request by user: {}", userEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            JobPostingDTO updatedJob = jobService.toggleJobStatus(jobId, userEmail);
            logger.info("Job with ID: {} status toggled to {} by user: {}", jobId, updatedJob.getStatus(), userEmail);
            return ResponseEntity.ok(updatedJob);
        } catch (RuntimeException e) {
            logger.error("Failed to toggle job status for job with ID: {} by user: {}: {}", jobId, userEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }






    @GetMapping("/search")
    public ResponseEntity<?> searchJobs(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category) {
        String user = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : "anonymous";
        logger.info("User {} searching jobs with title: {}, location: {}, category: {}", user, title, location, category);
        try {
            List<JobPostingDTO> jobs = jobService.searchJobs(title, location, category);
            logger.info("Found {} jobs matching criteria for user: {}", jobs.size(), user);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            logger.error("Failed to search jobs for user: {}: {}", user, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to search jobs: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveJobs() {
        String user = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : "anonymous";
        logger.info("User {} accessing active jobs", user);
        try {
            List<JobPostingDTO> jobs = jobService.getActiveJobs();
            logger.info("Retrieved {} active jobs for user: {}", jobs.size(), user);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            logger.error("Failed to retrieve active jobs for user: {}: {}", user, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve active jobs: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getJobById(@PathVariable Long id) {
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("User {} accessing job with ID: {}", user, id);
        try {
            if (id == null) {
                logger.warn("Job ID is null in getJobById request by user: {}", user);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            JobPostingDTO job = jobService.getJobById(id);
            logger.info("Retrieved job with ID: {} for user: {}", id, user);
            return ResponseEntity.ok(job);
        } catch (EntityNotFoundException e) {
            logger.warn("Job not found with ID: {} for user: {}: {}", id, user, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Failed to retrieve job with ID: {} for user: {}: {}", id, user, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve job: " + e.getMessage()));
        }
    }
}