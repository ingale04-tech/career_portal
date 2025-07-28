package com.example.career_portal.controller;

import com.example.career_portal.dto.ApplicationResponseDto;
import com.example.career_portal.dto.HiringReportDTO;
import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.entity.ApplicantSkills;
import com.example.career_portal.entity.JobApplication;
import com.example.career_portal.entity.JobPosting;
import com.example.career_portal.repository.JobPostingRepository;
import com.example.career_portal.service.JobApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.OptimisticLockException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);
    private static final String RESUME_UPLOAD_DIR = "uploads/resumes/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for resume uploads

    private final JobApplicationService applicationService;
    private final JobPostingRepository jobPostingRepository;

    public ApplicationController(JobApplicationService applicationService, JobPostingRepository jobPostingRepository) {
        this.applicationService = applicationService;
        this.jobPostingRepository = jobPostingRepository;
    }

    @PostMapping(value = "/apply/{jobId}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> applyToJob(
            @PathVariable Long jobId,
            @RequestPart("resume") MultipartFile resumeFile) {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Received application request for jobId: {} by applicant: {}", jobId, applicantEmail);
        try {
            if (jobId == null) {
                logger.warn("Job ID is null in applyToJob request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }

            if (resumeFile == null || resumeFile.isEmpty()) {
                logger.warn("Resume file is null or empty in applyToJob request for jobId: {} by applicant: {}", jobId, applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Resume file cannot be null or empty"));
            }
            if (!"application/pdf".equals(resumeFile.getContentType())) {
                logger.warn("Invalid file type for jobId: {} by applicant: {}. Expected PDF, got: {}", jobId, applicantEmail, resumeFile.getContentType());
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are allowed"));
            }
            if (resumeFile.getSize() > MAX_FILE_SIZE) {
                logger.warn("Resume file size exceeds limit for jobId: {} by applicant: {}. Size: {}", jobId, applicantEmail, resumeFile.getSize());
                return ResponseEntity.badRequest().body(Map.of("error", "Resume file size exceeds 5MB limit"));
            }

            JobPosting job = jobPostingRepository.findById(jobId)
                    .orElseThrow(() -> {
                        logger.error("Job not found with ID: {}", jobId);
                        return new jakarta.persistence.EntityNotFoundException("Job not found with ID: " + jobId);
                    });
            if (!"OPEN".equalsIgnoreCase(job.getStatus())) {
                logger.warn("Cannot apply for a closed job with ID: {} by applicant: {}", jobId, applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot apply for a closed job"));
            }

            if (applicationService.existsByApplicantEmailAndJobId(applicantEmail, jobId)) {
                logger.warn("User {} has already applied for job {}", applicantEmail, jobId);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "You have already applied for this job"));
            }

            String resumeFileName = UUID.randomUUID() + "-" + resumeFile.getOriginalFilename();
            Path resumePath = Paths.get(RESUME_UPLOAD_DIR, resumeFileName);
            Files.createDirectories(resumePath.getParent());
            Files.write(resumePath, resumeFile.getBytes());
            String resumeUrl = "/resumes/" + resumeFileName;

            ApplicationResponseDto responseDto = applicationService.applyForJob(jobId, applicantEmail, resumeUrl);
            logger.info("Application submitted successfully for jobId: {} by applicant: {}", jobId, applicantEmail);
            return ResponseEntity.ok(Map.of(
                    "message", "Application submitted successfully",
                    "application", responseDto
            ));
        } catch (IllegalStateException e) {
            logger.warn("Failed to apply for jobId: {} by applicant: {}: {}", jobId, applicantEmail, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            logger.warn("Failed to apply for jobId: {} by applicant: {}: {}", jobId, applicantEmail, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            logger.error("IO error while processing resume for jobId: {} by applicant: {}", jobId, applicantEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process resume file: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while applying for jobId: {} by applicant: {}", jobId, applicantEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to apply for job: " + e.getMessage()));
        }
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> getMyApplications() {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching applications for applicant: {}", applicantEmail);
        try {
            List<ApplicationResponseDto> responseDtos = applicationService.getMyApplications().stream()
                    .map(this::mapToApplicationResponseDto)
                    .collect(Collectors.toList());
            logger.info("Retrieved {} applications for applicant: {}", responseDtos.size(), applicantEmail);
            return ResponseEntity.ok(responseDtos);
        } catch (Exception e) {
            logger.error("Failed to retrieve applications for applicant: {}: {}", applicantEmail, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve applications: " + e.getMessage()));
        }
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> getApplicationsForJob(@PathVariable Long jobId) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching applications for jobId: {} by HR: {}", jobId, hrEmail);
        try {
            if (jobId == null) {
                logger.warn("Job ID is null in getApplicationsForJob request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            List<ApplicationResponseDto> responseDtos = applicationService.getApplicationsForJob(jobId).stream()
                    .map(this::mapToApplicationResponseDto)
                    .collect(Collectors.toList());
            logger.info("Retrieved {} applications for jobId: {} by HR: {}", responseDtos.size(), jobId, hrEmail);
            return ResponseEntity.ok(responseDtos);
        } catch (RuntimeException e) {
            logger.warn("Failed to retrieve applications for jobId: {} by HR: {}: {}", jobId, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{applicationId}/status")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestParam String status) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Updating application status for applicationId: {} by HR: {}", applicationId, hrEmail);
        try {
            if (applicationId == null) {
                logger.warn("Application ID is null in updateApplicationStatus request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Application ID cannot be null"));
            }
            if (status == null || status.trim().isEmpty()) {
                logger.warn("Status is null or empty in updateApplicationStatus request for applicationId: {} by HR: {}", applicationId, hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Status cannot be null or empty"));
            }
            JobApplication updatedApplication = applicationService.updateApplicationStatus(applicationId, status);
            ApplicationResponseDto responseDto = mapToApplicationResponseDto(updatedApplication);
            logger.info("Application with ID: {} updated to status: {} by HR: {}", applicationId, status, hrEmail);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid status value for applicationId: {} by HR: {}: {}", applicationId, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            logger.warn("Failed to update application status for applicationId: {} by HR: {}: {}", applicationId, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/job/{jobId}/filter")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> filterApplications(
            @PathVariable Long jobId,
            @RequestParam(required = false) String status) {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Filtering applications for jobId: {} with status: {} by HR: {}", jobId, status, hrEmail);
        try {
            if (jobId == null) {
                logger.warn("Job ID is null in filterApplications request by HR: {}", hrEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            List<ApplicationResponseDto> responseDtos = applicationService.filterApplications(jobId, status).stream()
                    .map(this::mapToApplicationResponseDto)
                    .collect(Collectors.toList());
            logger.info("Retrieved {} filtered applications for jobId: {} by HR: {}", responseDtos.size(), jobId, hrEmail);
            return ResponseEntity.ok(responseDtos);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid status value for jobId: {} by HR: {}: {}", jobId, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            logger.warn("Failed to filter applications for jobId: {} by HR: {}: {}", jobId, hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/report/{jobId}")
    @PreAuthorize("hasAnyRole('ROLE_HR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> getHiringReport(@PathVariable Long jobId) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Generating hiring report for jobId: {} by user: {}", jobId, userEmail);
        try {
            if (jobId == null) {
                logger.warn("Job ID is null in getHiringReport request by user: {}", userEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Job ID cannot be null"));
            }
            HiringReportDTO report = applicationService.generateHiringReport(jobId);
            logger.info("Hiring report generated for jobId: {} by user: {}", jobId, userEmail);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            logger.warn("Failed to generate hiring report for jobId: {} by user: {}: {}", jobId, userEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/shortlisted-count")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> getShortlistedCount() {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching shortlisted applicant count for HR: {}", hrEmail);
        try {
            Map<String, Object> result = applicationService.getShortlistedApplicantCount();
            logger.info("Retrieved shortlisted applicant count for HR: {}", hrEmail);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.warn("Failed to retrieve shortlisted applicant count for HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/hr-details")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<?> getHrDetails() {
        String hrEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching HR details for HR: {}", hrEmail);
        try {
            Map<String, Object> details = applicationService.hrDetails();
            logger.info("Retrieved HR details for HR: {}", hrEmail);
            return ResponseEntity.ok(details);
        } catch (RuntimeException e) {
            logger.warn("Failed to retrieve HR details for HR: {}: {}", hrEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/applicant-details")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> getApplicantDetails() {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching applicant details for applicant: {}", applicantEmail);
        try {
            Map<String, Object> details = applicationService.applicantsDetails();
            logger.info("Retrieved applicant details for applicant: {}", applicantEmail);
            return ResponseEntity.ok(details);
        } catch (RuntimeException e) {
            logger.warn("Failed to retrieve applicant details for applicant: {}: {}", applicantEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/skills")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> addSkill(@RequestParam String skill) {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Adding skill for applicant: {}", applicantEmail);
        try {
            if (skill == null || skill.trim().isEmpty()) {
                logger.warn("Skill is null or empty in addSkill request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Skill cannot be null or empty"));
            }
            ApplicantSkills applicantSkill = applicationService.addApplicantSkill(applicantEmail, skill);
            Map<String, Object> response = Map.of(
                    "skillId", applicantSkill.getId(),
                    "skill", applicantSkill.getSkill(),
                    "message", "Skill added successfully"
            );
            logger.info("Skill '{}' added successfully for applicant: {}", skill, applicantEmail);
            return ResponseEntity.ok(response);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Failed to add skill for applicant: {}: Skill '{}' already exists", applicantEmail, skill);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Skill '" + skill + "' already exists for this applicant"));
        } catch (RuntimeException e) {
            logger.warn("Failed to add skill for applicant: {}: {}", applicantEmail, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while adding skill for applicant: {}", applicantEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add skill due to server error: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/primary-skill", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> updatePrimarySkill(
            @RequestParam(value = "skill", required = false) String skill,
            @RequestParam(value = "experience", required = false) Integer experience,
            @RequestParam(value = "linkedin", required = false) String linkedin,
            @RequestParam(value = "portfolio", required = false) String portfolio,
            @RequestPart(value = "resume", required = false) MultipartFile resumeFile) {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Updating primary skill and details for applicant: {}", applicantEmail);
        try {
            if (skill != null && skill.trim().isEmpty()) {
                logger.warn("Skill is empty in updatePrimarySkill request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Skill cannot be empty if provided"));
            }
            if (experience != null && experience < 0) {
                logger.warn("Experience is negative in updatePrimarySkill request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Experience cannot be negative"));
            }
            if (resumeFile != null && !resumeFile.isEmpty()) {
                if (!"application/pdf".equals(resumeFile.getContentType()) &&
                        !"application/msword".equals(resumeFile.getContentType()) &&
                        !"application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(resumeFile.getContentType())) {
                    logger.warn("Invalid resume file type in updatePrimarySkill request by applicant: {}", applicantEmail);
                    return ResponseEntity.badRequest().body(Map.of("error", "Resume must be a PDF or Word document"));
                }
                if (resumeFile.getSize() > MAX_FILE_SIZE) {
                    logger.warn("Resume file size exceeds limit in updatePrimarySkill request by applicant: {}", applicantEmail);
                    return ResponseEntity.badRequest().body(Map.of("error", "Resume file size exceeds 5MB limit"));
                }
            }

            ApplicantDetails applicant = applicationService.updatePrimarySkill(skill, experience, linkedin, portfolio, resumeFile);
            Map<String, Object> response = Map.of(
                    "applicantId", applicant.getApplicantId(),
                    "primarySkill", applicant.getSkill() != null ? applicant.getSkill() : "",
                    "experience", applicant.getExperience() != null ? applicant.getExperience() : "",
                    "linkedin", applicant.getLinkedin() != null ? applicant.getLinkedin() : "",
                    "portfolio", applicant.getPortfolio() != null ? applicant.getPortfolio() : "",
                    "resume", applicant.getResume() != null ? applicant.getResume() : "",
                    "message", "Primary skill and profile details updated successfully"
            );
            logger.info("Primary skill and details updated successfully for applicant: {}", applicantEmail);
            return ResponseEntity.ok(response);
        } catch (OptimisticLockException e) {
            logger.warn("Optimistic lock exception while updating primary skill for applicant: {}", applicantEmail, e);
            return ResponseEntity.badRequest().body(Map.of("error", "Another update occurred. Please try again."));
        } catch (RuntimeException e) {
            logger.warn("Failed to update primary skill for applicant: {}: {}", applicantEmail, e.getMessage());
            String errorMessage = e.getMessage().contains("concurrent updates")
                    ? "Another update occurred. Please try again."
                    : e.getMessage();
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        } catch (IOException e) {
            logger.error("IO error while updating primary skill for applicant: {}", applicantEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update profile due to server error: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while updating primary skill for applicant: {}", applicantEmail, e);
            // Check the cause chain for OptimisticLockException
            Throwable cause = e;
            while (cause != null) {
                if (cause instanceof OptimisticLockException) {
                    logger.warn("Found OptimisticLockException in cause chain for applicant: {}", applicantEmail);
                    return ResponseEntity.badRequest().body(Map.of("error", "Another update occurred. Please try again."));
                }
                cause = cause.getCause();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/applicant-details", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ROLE_APPLICANT')")
    public ResponseEntity<?> addApplicantDetails(
            @RequestParam(value = "skill", required = false) String skill,
            @RequestParam(value = "experience", required = false) Integer experience,
            @RequestParam(value = "linkedin", required = false) String linkedin,
            @RequestParam(value = "portfolio", required = false) String portfolio,
            @RequestPart(value = "resume", required = false) MultipartFile resumeFile) {
        String applicantEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Adding/Updating applicant details for applicant: {}", applicantEmail);
        try {
            if (skill == null || skill.trim().isEmpty()) {
                logger.warn("Skill is null or empty in addApplicantDetails request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Skill is required"));
            }
            if (experience != null && experience < 0) {
                logger.warn("Experience is negative in addApplicantDetails request by applicant: {}", applicantEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Experience cannot be negative"));
            }
            if (resumeFile != null && !resumeFile.isEmpty()) {
                if (!"application/pdf".equals(resumeFile.getContentType()) &&
                        !"application/msword".equals(resumeFile.getContentType()) &&
                        !"application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(resumeFile.getContentType())) {
                    logger.warn("Invalid resume file type in addApplicantDetails request by applicant: {}", applicantEmail);
                    return ResponseEntity.badRequest().body(Map.of("error", "Resume must be a PDF or Word document"));
                }
                if (resumeFile.getSize() > MAX_FILE_SIZE) {
                    logger.warn("Resume file size exceeds limit in addApplicantDetails request by applicant: {}", applicantEmail);
                    return ResponseEntity.badRequest().body(Map.of("error", "Resume file size exceeds 5MB limit"));
                }
            }

            ApplicantDetails applicantDetails = applicationService.addApplicantDetails(skill, experience, linkedin, portfolio, resumeFile);
            Map<String, Object> response = Map.of(
                    "applicantId", applicantDetails.getApplicantId(),
                    "primarySkill", applicantDetails.getSkill() != null ? applicantDetails.getSkill() : "",
                    "experience", applicantDetails.getExperience() != null ? applicantDetails.getExperience() : "",
                    "linkedin", applicantDetails.getLinkedin() != null ? applicantDetails.getLinkedin() : "",
                    "portfolio", applicantDetails.getPortfolio() != null ? applicantDetails.getPortfolio() : "",
                    "resume", applicantDetails.getResume() != null ? applicantDetails.getResume() : "",
                    "message", "Applicant details added/updated successfully"
            );
            logger.info("Applicant details added/updated successfully for applicant: {}", applicantEmail);
            return ResponseEntity.ok(response);
        } catch (OptimisticLockException e) {
            logger.warn("Optimistic lock exception while adding applicant details for applicant: {}", applicantEmail, e);
            return ResponseEntity.badRequest().body(Map.of("error", "Another update occurred. Please try again."));
        } catch (RuntimeException e) {
            logger.warn("Failed to add applicant details for applicant: {}: {}", applicantEmail, e.getMessage());
            String errorMessage = e.getMessage().contains("concurrent updates")
                    ? "Another update occurred. Please try again."
                    : e.getMessage();
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        } catch (IOException e) {
            logger.error("IO error while adding applicant details for applicant: {}", applicantEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add applicant details due to server error: " + e.getMessage()));
        }
    }

    private ApplicationResponseDto mapToApplicationResponseDto(JobApplication application) {
        ApplicationResponseDto dto = new ApplicationResponseDto();
        dto.setId(application.getId());
        dto.setAppliedAt(application.getAppliedAt());
        dto.setStatus(application.getStatus().name());
        dto.setResumeUrl(application.getResumeUrl());
        dto.setApplicantId(application.getApplicant().getId());
        dto.setApplicantName(application.getApplicant().getFullName());
        dto.setJobId(application.getJob().getId());
        dto.setJobTitle(application.getJob().getTitle());
        return dto;
    }
}