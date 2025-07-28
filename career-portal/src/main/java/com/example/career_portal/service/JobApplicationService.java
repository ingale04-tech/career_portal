package com.example.career_portal.service;

import com.example.career_portal.dto.ApplicationResponseDto;
import com.example.career_portal.dto.HiringReportDTO;
import com.example.career_portal.dto.JobPostingDTO;
import com.example.career_portal.entity.*;
import com.example.career_portal.repository.ApplicantDetailsRepository;
import com.example.career_portal.repository.ApplicantSkillsRepository;
import com.example.career_portal.repository.HrDetailsRepository;
import com.example.career_portal.repository.JobApplicationRepository;
import com.example.career_portal.repository.JobPostingRepository;
import com.example.career_portal.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(JobApplicationService.class);

    private final JobApplicationRepository jobApplicationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final UserRepository userRepository;
    private final ApplicantDetailsRepository applicantDetailsRepository;
    private final ApplicantSkillsRepository applicantSkillsRepository;
    private final HrDetailsRepository hrDetailsRepository;
    private final ApplicantDetailsService applicantDetailsService;
    private final EntityManager entityManager;

    private static final String UPLOAD_DIR = "uploads/resumes/";

    public JobApplicationService(JobApplicationRepository jobApplicationRepository,
                                 JobPostingRepository jobPostingRepository,
                                 UserRepository userRepository,
                                 ApplicantDetailsRepository applicantDetailsRepository,
                                 ApplicantSkillsRepository applicantSkillsRepository,
                                 HrDetailsRepository hrDetailsRepository,
                                 ApplicantDetailsService applicantDetailsService,
                                 EntityManager entityManager) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.userRepository = userRepository;
        this.applicantDetailsRepository = applicantDetailsRepository;
        this.applicantSkillsRepository = applicantSkillsRepository;
        this.hrDetailsRepository = hrDetailsRepository;
        this.applicantDetailsService = applicantDetailsService;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public boolean existsByApplicantEmailAndJobId(String applicantEmail, Long jobId) {
        User applicant = userRepository.findByEmail(applicantEmail)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", applicantEmail);
                    return new EntityNotFoundException("Applicant not found with email: " + applicantEmail);
                });
        boolean exists = jobApplicationRepository.existsByApplicantIdAndJobId(applicant.getId(), jobId);
        logger.debug("Checked application existence for email: {} and jobId: {}. Result: {}", applicantEmail, jobId, exists);
        return exists;
    }

    @Transactional
    public ApplicationResponseDto applyForJob(Long jobId, String applicantEmail, String resumeUrl) {
        User applicant = userRepository.findByEmail(applicantEmail)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", applicantEmail);
                    return new EntityNotFoundException("Applicant not found with email: " + applicantEmail);
                });
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new EntityNotFoundException("Job not found with ID: " + jobId);
                });

        if (!"OPEN".equalsIgnoreCase(job.getStatus())) {
            logger.warn("Cannot apply for closed job with ID: {} by applicant: {}", jobId, applicantEmail);
            throw new IllegalStateException("Cannot apply for a closed job");
        }

        if (jobApplicationRepository.existsByApplicantIdAndJobId(applicant.getId(), jobId)) {
            logger.warn("Applicant {} has already applied for jobId: {}", applicantEmail, jobId);
            throw new IllegalStateException("You have already applied for this job");
        }

        JobApplication application = new JobApplication();
        application.setApplicant(applicant);
        application.setJob(job);
        application.setStatus(ApplicationStatus.PENDING);
        application.setResumeUrl(resumeUrl);
        application.setAppliedAt(LocalDateTime.now());

        JobApplication savedApplication = jobApplicationRepository.save(application);
        logger.info("Application submitted successfully for jobId: {} by applicant: {}", jobId, applicantEmail);
        return mapToApplicationResponseDto(savedApplication);
    }

    public List<JobApplication> getMyApplications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User applicant = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", email);
                    return new EntityNotFoundException("Applicant not found with email: " + email);
                });
        logger.info("Fetching applications for applicant: {}", email);
        return jobApplicationRepository.findByApplicantId(applicant.getId());
    }

    public List<JobApplication> getApplicationsForJob(Long jobId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", email);
                    return new EntityNotFoundException("HR not found with email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new EntityNotFoundException("Job not found with ID: " + jobId);
                });
        if (!job.getHr().getId().equals(hr.getId())) {
            logger.warn("HR {} not authorized to view applications for jobId: {}", email, jobId);
            throw new IllegalStateException("You can only view applications for your own jobs");
        }
        logger.info("Fetching applications for jobId: {}", jobId);
        return jobApplicationRepository.findByJobId(jobId);
    }

    @Transactional
    public JobApplication updateApplicationStatus(Long applicationId, String status) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", email);
                    return new EntityNotFoundException("HR not found with email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> {
                    logger.error("Application not found with ID: {}", applicationId);
                    return new EntityNotFoundException("Application not found with ID: " + applicationId);
                });
        JobPosting job = application.getJob();
        logger.info("HR ID: {}, Job ID: {}, Job HR ID: {}", hr.getId(), job.getId(), job.getHr().getId());
        if (!job.getHr().getId().equals(hr.getId())) {
            logger.warn("HR {} not authorized to update application with ID: {}", email, applicationId);
            throw new IllegalStateException("You can only update applications for your own jobs");
        }
        try {
            ApplicationStatus newStatus = ApplicationStatus.valueOf(status.toUpperCase());
            logger.info("Updating application ID: {} to status: {}", applicationId, newStatus);
            application.setStatus(newStatus);
            JobApplication updatedApplication = jobApplicationRepository.save(application);
            logger.info("Application with ID: {} updated to status: {}", applicationId, newStatus);
            return updatedApplication;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status value: {}", status, e);
            throw new IllegalArgumentException("Invalid status value: " + status);
        }
    }

    public List<JobApplication> filterApplications(Long jobId, String status) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", email);
                    return new EntityNotFoundException("HR not found with email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new EntityNotFoundException("Job not found with ID: " + jobId);
                });
        if (!job.getHr().getId().equals(hr.getId())) {
            logger.warn("HR {} not authorized to filter applications for jobId: {}", email, jobId);
            throw new IllegalStateException("You can only filter applications for your own jobs");
        }
        logger.info("Filtering applications for jobId: {} with status: {}", jobId, status);
        if (status != null && !status.isEmpty()) {
            try {
                return jobApplicationRepository.findByJobIdAndStatus(jobId, ApplicationStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.error("Invalid status value: {}", status, e);
                throw new IllegalArgumentException("Invalid status value: " + status);
            }
        }
        return jobApplicationRepository.findByJobId(jobId);
    }

    public HiringReportDTO generateHiringReport(Long jobId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new EntityNotFoundException("User not found with email: " + email);
                });
        if (user.getRole().equals(User.Role.HR) && !user.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new EntityNotFoundException("Job not found with ID: " + jobId);
                });

        if (!user.getRole().equals(User.Role.SUPER_ADMIN) && !job.getHr().getId().equals(user.getId())) {
            logger.warn("User {} not authorized to view report for jobId: {}", email, jobId);
            throw new IllegalStateException("Not authorized to view this report");
        }

        List<JobApplication> applications = jobApplicationRepository.findByJobId(jobId);
        HiringReportDTO report = new HiringReportDTO();
        report.setJobId(jobId);
        report.setJobTitle(job.getTitle());
        report.setTotalApplications(applications.size());
        report.setPending((int) applications.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count());
        report.setShortlisted((int) applications.stream().filter(a -> a.getStatus() == ApplicationStatus.SHORTLISTED).count());
        report.setRejected((int) applications.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count());
        report.setHired((int) applications.stream().filter(a -> a.getStatus() == ApplicationStatus.HIRED).count());
        logger.info("Generated hiring report for jobId: {}", jobId);
        return report;
    }

    public Map<String, Object> getShortlistedApplicantCount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", email);
                    return new EntityNotFoundException("HR not found with email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }
        List<JobPosting> hrJobs = jobPostingRepository.findByHrId(hr.getId());
        List<Long> jobIds = hrJobs.stream().map(JobPosting::getId).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("hrEmail", email);

        if (jobIds.isEmpty()) {
            result.put("pendingApplicants", 0L);
            result.put("shortlistedApplicants", 0L);
            result.put("rejectedApplicants", 0L);
            logger.info("No jobs found for HR: {}, returning zero counts", email);
            return result;
        }

        List<JobApplication> pendingApplications = jobApplicationRepository.findByJobIdInAndStatus(
                jobIds, ApplicationStatus.PENDING);
        List<JobApplication> shortlistedApplications = jobApplicationRepository.findByJobIdInAndStatus(
                jobIds, ApplicationStatus.SHORTLISTED);
        List<JobApplication> rejectedApplications = jobApplicationRepository.findByJobIdInAndStatus(
                jobIds, ApplicationStatus.REJECTED);

        long pendingCount = pendingApplications.stream()
                .map(app -> app.getApplicant().getId())
                .distinct()
                .count();
        long shortlistedCount = shortlistedApplications.stream()
                .map(app -> app.getApplicant().getId())
                .distinct()
                .count();
        long rejectedCount = rejectedApplications.stream()
                .map(app -> app.getApplicant().getId())
                .distinct()
                .count();

        result.put("pendingApplicants", pendingCount);
        result.put("shortlistedApplicants", shortlistedCount);
        result.put("rejectedApplicants", rejectedCount);
        logger.info("Fetched applicant counts for HR: {}", email);
        return result;
    }

    public Map<String, Object> applicantsDetails() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User applicantUser = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", email);
                    return new EntityNotFoundException("Applicant not found with email: " + email);
                });

        Map<String, Object> details = new HashMap<>();
        details.put("id", applicantUser.getId());
        details.put("fullName", applicantUser.getFullName());
        details.put("email", applicantUser.getEmail());
        details.put("phone", applicantUser.getPhone());
        details.put("role", applicantUser.getRole().name());

        ApplicantDetails applicantDetails = applicantDetailsRepository.findById(applicantUser.getId()).orElse(null);
        if (applicantDetails == null) {
            logger.info("Applicant profile not found for userId: {}. Prompting to create profile.", applicantUser.getId());
            details.put("profileExists", false);
            details.put("message", "Please add your applicant details to continue.");
            return details;
        }

        details.put("profileExists", true);
        details.put("applicantId", applicantDetails.getApplicantId());
        details.put("primarySkill", applicantDetails.getSkill() != null ? applicantDetails.getSkill().toLowerCase() : "Not set");

        List<ApplicantSkills> skills = applicantSkillsRepository.findByApplicantApplicantId(applicantDetails.getApplicantId());
        details.put("skills", skills.stream()
                .map(skill -> skill.getSkill().toLowerCase())
                .collect(Collectors.toList()));

        List<JobApplication> applications = jobApplicationRepository.findByApplicantId(applicantUser.getId());
        details.put("totalApplicationsSubmitted", applications.size());
        details.put("pendingApplications", applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING).count());
        details.put("shortlistedApplications", applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SHORTLISTED).count());
        details.put("rejectedApplications", applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count());
        details.put("hiredApplications", applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.HIRED).count());

        details.put("experience", applicantDetails.getExperience());
        details.put("linkedin", applicantDetails.getLinkedin());
        details.put("portfolio", applicantDetails.getPortfolio());
        details.put("resume", applicantDetails.getResume());
        logger.info("Fetched applicant details for email: {}", email);
        return details;
    }

    @Transactional
    public ApplicantSkills addApplicantSkill(String email, String skill) throws IOException {
        if (skill == null || skill.trim().isEmpty()) {
            logger.error("Skill cannot be null or empty");
            throw new IllegalArgumentException("Skill cannot be null or empty");
        }

        String normalizedSkill = skill.trim().toLowerCase();

        User applicantUser = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", email);
                    return new EntityNotFoundException("Applicant not found with email: " + email);
                });

        // Merge the User entity to ensure it is managed
        logger.debug("User entity state before merge: {}", applicantUser);
        User managedApplicantUser = entityManager.merge(applicantUser);
        logger.debug("User entity state after merge: {}", managedApplicantUser);

        Long userId = managedApplicantUser.getId(); // Extract the ID before any reassignment

        ApplicantDetails applicantDetails = applicantDetailsRepository.findById(userId)
                .orElseGet(() -> {
                    ApplicantDetails newDetails = new ApplicantDetails();
                    newDetails.setUser(managedApplicantUser);
                    newDetails.setApplicantId(userId);
                    try {
                        return applicantDetailsService.createApplicantDetails(newDetails, null, email);
                    } catch (IOException e) {
                        logger.error("Failed to create applicant details for email: {}", email, e);
                        throw new RuntimeException("Failed to create applicant details", e);
                    }
                });

        // Merge the ApplicantDetails entity to ensure it is managed
        logger.debug("ApplicantDetails entity state before merge: {}", applicantDetails);
        ApplicantDetails managedApplicantDetails = entityManager.merge(applicantDetails);
        logger.debug("ApplicantDetails entity state after merge: {}", managedApplicantDetails);

        if (managedApplicantDetails.getSkill() != null && managedApplicantDetails.getSkill().trim().equalsIgnoreCase(normalizedSkill)) {
            logger.warn("Skill '{}' is already set as the primary skill for applicantId: {}", skill, managedApplicantDetails.getApplicantId());
            throw new DataIntegrityViolationException("Skill '" + skill + "' is already set as the primary skill for this applicant");
        }

        if (applicantSkillsRepository.existsByApplicantApplicantIdAndSkill(managedApplicantDetails.getApplicantId(), normalizedSkill)) {
            logger.warn("Skill '{}' already exists for applicantId: {}", skill, managedApplicantDetails.getApplicantId());
            throw new DataIntegrityViolationException("Skill '" + skill + "' already exists for this applicant");
        }

        ApplicantSkills applicantSkill = new ApplicantSkills();
        applicantSkill.setApplicant(managedApplicantDetails);
        applicantSkill.setSkill(normalizedSkill);
        applicantSkill.setUser(managedApplicantUser);
        ApplicantSkills savedSkill = applicantSkillsRepository.save(applicantSkill);
        logger.info("Added skill '{}' for applicantId: {}", normalizedSkill, managedApplicantDetails.getApplicantId());
        return savedSkill;
    }

    public List<JobApplication> findAllApplications() {
        logger.debug("Fetching all applications");
        return jobApplicationRepository.findAll();
    }

    @Transactional
    public ApplicantDetails addApplicantDetails(String skill, Integer experience, String linkedin, String portfolio, MultipartFile resumeFile) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User applicantUser = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", email);
                    return new EntityNotFoundException("Applicant not found with email: " + email);
                });

        // Merge the User entity to ensure it is managed
        logger.debug("User entity state before merge: {}", applicantUser);
        User managedApplicantUser = entityManager.merge(applicantUser);
        logger.debug("User entity state after merge: {}", managedApplicantUser);

        int maxRetries = 3;
        ApplicantDetails applicantDetails = null;
        Long userId = managedApplicantUser.getId(); // Extract the ID before the loop
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Fetch the entity within the transaction
                User finalManagedApplicantUser = managedApplicantUser;
                applicantDetails = applicantDetailsRepository.findById(userId)
                        .orElseGet(() -> {
                            ApplicantDetails newDetails = new ApplicantDetails();
                            newDetails.setUser(finalManagedApplicantUser);
                            newDetails.setApplicantId(userId);
                            return newDetails;
                        });

                if (skill != null && !skill.trim().isEmpty()) {
                    applicantDetails.setSkill(skill);
                }
                if (experience != null) {
                    if (experience < 0) {
                        throw new IllegalArgumentException("Experience cannot be negative");
                    }
                    applicantDetails.setExperience(experience);
                }
                if (linkedin != null && !linkedin.trim().isEmpty()) {
                    try {
                        new URL(linkedin).toURI();
                        applicantDetails.setLinkedin(linkedin);
                    } catch (Exception e) {
                        logger.error("Invalid LinkedIn URL: {}", linkedin, e);
                        throw new IllegalArgumentException("Invalid LinkedIn URL: " + linkedin);
                    }
                }
                if (portfolio != null && !portfolio.trim().isEmpty()) {
                    try {
                        new URL(portfolio).toURI();
                        applicantDetails.setPortfolio(portfolio);
                    } catch (Exception e) {
                        logger.error("Invalid portfolio URL: {}", portfolio, e);
                        throw new IllegalArgumentException("Invalid portfolio URL: " + portfolio);
                    }
                }
                if (resumeFile != null && !resumeFile.isEmpty()) {
                    try {
                        String fileName = UUID.randomUUID().toString() + "-" + resumeFile.getOriginalFilename();
                        Path filePath = Paths.get(UPLOAD_DIR, fileName);
                        Files.createDirectories(filePath.getParent());
                        Files.write(filePath, resumeFile.getBytes());
                        applicantDetails.setResume("http://localhost:8080/resumes/" + fileName);
                    } catch (IOException e) {
                        logger.error("Failed to upload resume file for email: {}", email, e);
                        throw new IOException("Failed to upload resume file", e);
                    }
                }

                // Save the entity
                ApplicantDetails savedDetails = applicantDetailsRepository.save(applicantDetails);
                logger.info("Added/Updated applicant details for email: {}", email);
                return savedDetails;
            } catch (OptimisticLockException e) {
                logger.warn("Attempt {} failed due to optimistic lock for ApplicantDetails#{} for email: {}", attempt, userId, email, e);
                if (attempt == maxRetries) {
                    throw new RuntimeException("Failed to update applicant details after " + maxRetries + " attempts due to concurrent updates.");
                }
                try {
                    Thread.sleep(100 * (1 << (attempt - 1))); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry delay", ie);
                }
                entityManager.clear();
                // Re-merge the User entity after clearing
                managedApplicantUser = entityManager.merge(managedApplicantUser);
            }
        }
        throw new RuntimeException("Unexpected failure in addApplicantDetails");
    }

    public List<JobPostingDTO> getAllJobs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching all jobs for user: {}", email);

        User applicant = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new EntityNotFoundException("User not found with email: " + email);
                });

        Long applicantId = (applicant.getRole() == User.Role.APPLICANT) ? applicant.getId() : null;

        List<JobPosting> jobs = jobPostingRepository.findAll();
        logger.debug("Retrieved {} jobs", jobs.size());

        Set<Long> appliedJobIds = applicantId != null
                ? jobApplicationRepository.findByApplicantId(applicantId)
                .stream()
                .map(jobApplication -> jobApplication.getJob().getId())
                .collect(Collectors.toSet())
                : Collections.emptySet();

        return jobs.stream().map(job -> {
            boolean canApply = applicantId != null
                    ? "OPEN".equals(job.getStatus()) && !appliedJobIds.contains(job.getId())
                    : false;
            return new JobPostingDTO(job, canApply);
        }).collect(Collectors.toList());
    }

    @Transactional
    public ApplicantDetails updatePrimarySkill(String skill, Integer experience, String linkedin, String portfolio, MultipartFile resumeFile) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User applicantUser = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", email);
                    return new EntityNotFoundException("Applicant not found with email: " + email);
                });

        // Merge the User entity to ensure it is managed
        logger.debug("User entity state before merge: {}", applicantUser);
        User managedApplicantUser = entityManager.merge(applicantUser);
        logger.debug("User entity state after merge: {}", managedApplicantUser);

        int maxRetries = 3;
        ApplicantDetails applicantDetails = null;
        Long userId = managedApplicantUser.getId(); // Extract the ID before the loop
        try {
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    applicantDetails = applicantDetailsRepository.findById(userId)
                            .orElseThrow(() -> {
                                logger.error("Applicant profile not found for userId: {}", userId);
                                return new EntityNotFoundException("Applicant profile not found for userId: " + userId);
                            });

                    logger.debug("Loaded ApplicantDetails#{} with version: {}", applicantDetails.getApplicantId(), applicantDetails.getVersion());

                    if (skill != null && !skill.trim().isEmpty()) {
                        applicantDetails.setSkill(skill);
                    }
                    if (experience != null) {
                        if (experience < 0) {
                            throw new IllegalArgumentException("Experience cannot be negative");
                        }
                        applicantDetails.setExperience(experience);
                    }
                    if (linkedin != null && !linkedin.trim().isEmpty()) {
                        try {
                            new URL(linkedin).toURI();
                            applicantDetails.setLinkedin(linkedin);
                        } catch (Exception e) {
                            logger.error("Invalid LinkedIn URL: {}", linkedin, e);
                            throw new IllegalArgumentException("Invalid LinkedIn URL: " + linkedin);
                        }
                    }
                    if (portfolio != null && !portfolio.trim().isEmpty()) {
                        try {
                            new URL(portfolio).toURI();
                            applicantDetails.setPortfolio(portfolio);
                        } catch (Exception e) {
                            logger.error("Invalid portfolio URL: {}", portfolio, e);
                            throw new IllegalArgumentException("Invalid portfolio URL: " + portfolio);
                        }
                    }
                    if (resumeFile != null && !resumeFile.isEmpty()) {
                        try {
                            String fileName = UUID.randomUUID().toString() + "-" + resumeFile.getOriginalFilename();
                            Path filePath = Paths.get(UPLOAD_DIR, fileName);
                            Files.createDirectories(filePath.getParent());
                            Files.write(filePath, resumeFile.getBytes());
                            applicantDetails.setResume("http://localhost:8080/resumes/" + fileName);
                        } catch (IOException e) {
                            logger.error("Failed to upload resume file for email: {}", email, e);
                            throw new IOException("Failed to upload resume file", e);
                        }
                    }

                    ApplicantDetails updatedDetails = applicantDetailsRepository.save(applicantDetails);
                    logger.info("Updated primary skill and details for email: {}, new version: {}", email, updatedDetails.getVersion());
                    return updatedDetails;
                } catch (OptimisticLockException e) {
                    logger.warn("Attempt {} failed due to optimistic lock for ApplicantDetails#{} for email: {}, version: {}",
                            attempt, userId, email, applicantDetails != null ? applicantDetails.getVersion() : "N/A", e);
                    if (attempt == maxRetries) {
                        throw new RuntimeException("Failed to update primary skill after " + maxRetries + " attempts due to concurrent updates.");
                    }
                    try {
                        Thread.sleep(100 * (1 << (attempt - 1))); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry delay", ie);
                    }
                    entityManager.clear();
                    // Re-merge the User entity after clearing
                    managedApplicantUser = entityManager.merge(managedApplicantUser);
                }
            }
            throw new RuntimeException("Unexpected failure in updatePrimarySkill after retries");
        } catch (Exception e) {
            // Enhanced check for OptimisticLockException in the cause chain
            Throwable cause = e;
            while (cause != null) {
                if (cause instanceof OptimisticLockException) {
                    logger.warn("Unexpected OptimisticLockException while updating primary skill for email: {}, cause: {}", email, cause.getMessage());
                    throw new RuntimeException("Failed to update primary skill due to concurrent updates.");
                }
                cause = cause.getCause();
            }
            logger.error("Unexpected error while updating primary skill for email: {}", email, e);
            throw e; // Re-throw other exceptions
        }
    }

    public Map<String, Object> hrDetails() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", email);
                    return new EntityNotFoundException("HR not found with email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }

        Map<String, Object> details = new HashMap<>();
        details.put("id", hr.getId());
        details.put("fullName", hr.getFullName());
        details.put("email", hr.getEmail());
        details.put("phone", hr.getPhone());
        details.put("role", hr.getRole().name());

        HrDetails hrDetails = hrDetailsRepository.findByHrId(hr.getId()).orElse(null);
        details.put("companyName", hrDetails != null ? hrDetails.getCompanyName() : null);
        details.put("designation", hrDetails != null ? hrDetails.getDesignation() : null);

        List<JobPosting> hrJobs = jobPostingRepository.findByHrId(hr.getId());
        details.put("totalJobsPosted", hrJobs.size());
        details.put("openJobs", hrJobs.stream().filter(j -> "OPEN".equals(j.getStatus())).count());

        List<Long> jobIds = hrJobs.stream().map(JobPosting::getId).collect(Collectors.toList());
        if (!jobIds.isEmpty()) {
            List<JobApplication> applications = jobApplicationRepository.findByJobIdIn(jobIds);
            details.put("totalApplicationsReceived", applications.size());
            details.put("pendingApplications", applications.stream()
                    .filter(a -> a.getStatus() == ApplicationStatus.PENDING).count());
            details.put("hiredApplicants", applications.stream()
                    .filter(a -> a.getStatus() == ApplicationStatus.HIRED).count());
        } else {
            details.put("totalApplicationsReceived", 0L);
            details.put("pendingApplications", 0L);
            details.put("hiredApplicants", 0L);
        }
        logger.info("Fetched HR details for email: {}", email);
        return details;
    }

    @Transactional
    public HrDetails updateHrDetails(String companyName, String designation) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.debug("Updating HR details for email: {}", email);

        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found for email: {}", email);
                    return new EntityNotFoundException("HR not found for email: " + email);
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", email);
            throw new IllegalStateException("HR account is not approved by Super Admin");
        }

        Long hrId = hr.getId(); // Extract the ID before any potential reassignment

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                HrDetails hrDetails = hrDetailsRepository.findByHrId(hrId)
                        .orElseGet(() -> {
                            logger.debug("No existing HrDetails found for HR ID: {}, creating new", hrId);
                            return new HrDetails(hr, null, null);
                        });
                hrDetails.setCompanyName(companyName);
                hrDetails.setDesignation(designation);
                HrDetails savedDetails = hrDetailsRepository.save(hrDetails);
                logger.info("HR details updated successfully for email: {}", email);
                return savedDetails;
            } catch (OptimisticLockException e) {
                logger.warn("Attempt {} failed due to optimistic lock for HrDetails#{}", attempt, hrId, e);
                if (attempt == maxRetries) {
                    throw new RuntimeException("Failed to update HR details after " + maxRetries + " attempts due to concurrent updates.");
                }
                try {
                    Thread.sleep(100 * (1 << (attempt - 1))); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry delay", ie);
                }
            }
        }
        throw new RuntimeException("Unexpected failure in updateHrDetails");
    }

    @Transactional
    public User approveHr(Long hrId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User superAdmin = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Super Admin not found with email: {}", email);
                    return new EntityNotFoundException("Super Admin not found with email: " + email);
                });
        if (!superAdmin.getRole().equals(User.Role.SUPER_ADMIN)) {
            logger.warn("User {} is not a Super Admin, cannot approve HR", email);
            throw new IllegalStateException("Only Super Admin can approve HR accounts");
        }
        User hr = userRepository.findById(hrId)
                .orElseThrow(() -> {
                    logger.error("HR not found with ID: {}", hrId);
                    return new EntityNotFoundException("HR not found with ID: " + hrId);
                });
        if (!hr.getRole().equals(User.Role.HR)) {
            logger.warn("User with ID: {} is not an HR", hrId);
            throw new IllegalStateException("User is not an HR");
        }
        hr.setIsApproved(true);
        User updatedHr = userRepository.save(hr);
        logger.info("HR with ID: {} approved by Super Admin: {}", hrId, email);
        return updatedHr;
    }

    @Transactional
    public User disableHr(Long hrId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User superAdmin = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Super Admin not found with email: {}", email);
                    return new EntityNotFoundException("Super Admin not found with email: " + email);
                });
        if (!superAdmin.getRole().equals(User.Role.SUPER_ADMIN)) {
            logger.warn("User {} is not a Super Admin, cannot disable HR", email);
            throw new IllegalStateException("Only Super Admin can disable HR accounts");
        }
        User hr = userRepository.findById(hrId)
                .orElseThrow(() -> {
                    logger.error("HR not found with ID: {}", hrId);
                    return new EntityNotFoundException("HR not found with ID: " + hrId);
                });
        if (!hr.getRole().equals(User.Role.HR)) {
            logger.warn("User with ID: {} is not an HR", hrId);
            throw new IllegalStateException("User is not an HR");
        }
        hr.setIsApproved(false);
        User updatedHr = userRepository.save(hr);
        logger.info("HR with ID: {} disabled by Super Admin: {}", hrId, email);
        return updatedHr;
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