package com.example.career_portal.service;

import com.example.career_portal.dto.ApplicationResponseDto;
import com.example.career_portal.dto.JobPostingDTO;
import com.example.career_portal.entity.ApplicationStatus;
import com.example.career_portal.entity.JobApplication;
import com.example.career_portal.entity.JobPosting;
import com.example.career_portal.entity.User;
import com.example.career_portal.repository.JobApplicationRepository;
import com.example.career_portal.repository.JobPostingRepository;
import com.example.career_portal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.CriteriaBuilder;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobService {
    private static final Logger logger = LoggerFactory.getLogger(JobService.class);

    private final JobPostingRepository jobRepository;
    private final UserRepository userRepository;
    private final JobApplicationService jobApplicationService;
    private final JobApplicationRepository jobApplicationRepository;

    private static final String UPLOAD_DIR = "uploads/"; // Directory for job images
    private static final String RESUME_UPLOAD_DIR = "uploads/resumes/"; // Directory for resumes

    public JobService(JobPostingRepository jobRepository,
                      UserRepository userRepository,
                      JobApplicationService jobApplicationService,
                      JobApplicationRepository jobApplicationRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.jobApplicationService = jobApplicationService;
        this.jobApplicationRepository = jobApplicationRepository;
    }

    @Transactional
    public void deleteJob(Long jobId) {
        logger.debug("Deleting job ID: {}", jobId);

        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }

        // Check if the job exists
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.info("Job not found: {}", jobId);
                    return new IllegalArgumentException("Job not found: " + jobId);
                });

        // Check for associated applications
        long applicationCount = jobApplicationRepository.countByJobId(jobId);
        if (applicationCount > 0) {
            logger.info("Deleting {} application(s) associated with job ID: {}", applicationCount, jobId);
            jobApplicationRepository.deleteByJobId(jobId);
        }

        // Delete the job
        jobRepository.deleteById(jobId);
        logger.info("Job ID {} deleted", jobId);
    }

    public List<JobPosting> findJobsByHrId(Long hrId) {
        logger.debug("Finding jobs for HR ID: {}", hrId);
        if (hrId == null) {
            logger.error("HR ID is null");
            throw new IllegalArgumentException("HR ID cannot be null");
        }
        return jobRepository.findByHrId(hrId);
    }

    // Helper method to count applications for a job
    public long countApplicationsByJobId(Long jobId) {
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        return jobApplicationRepository.countByJobId(jobId);
    }

    @Transactional
    public JobPostingDTO createJob(JobPosting job, String hrEmail) {
        if (job == null) {
            logger.error("Job object is null");
            throw new IllegalArgumentException("Job cannot be null");
        }
        if (hrEmail == null || hrEmail.trim().isEmpty()) {
            logger.error("HR email is null or empty");
            throw new IllegalArgumentException("HR email cannot be null or empty");
        }
        logger.info("Creating job for HR: {}", hrEmail);
        User hr = userRepository.findByEmail(hrEmail)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", hrEmail);
                    return new RuntimeException("HR not found");
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", hrEmail);
            throw new RuntimeException("HR account is not approved by Super Admin");
        }
        job.setHr(hr);
        job.setCreatedAt(LocalDateTime.now());
        job.setStatus("OPEN");
        JobPosting savedJob = jobRepository.save(job);
        logger.info("Job created with ID: {}", savedJob.getId());
        return new JobPostingDTO(savedJob);
    }

    public List<JobPostingDTO> getAllJobsForApplicants() {
        logger.debug("Fetching all jobs from repository for applicants");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        User applicant = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        Long applicantId = (applicant != null && applicant.getRole() == User.Role.APPLICANT) ? applicant.getId() : null;

        // Filter jobs by status = "OPEN"
        List<JobPosting> jobs = jobRepository.findByStatus("OPEN");
        Set<Long> appliedJobIds = applicantId != null ?
                jobApplicationRepository.findByApplicantId(applicantId)
                        .stream()
                        .map(app -> app.getJob().getId())
                        .collect(Collectors.toSet()) :
                Set.of();

        logger.debug("Retrieved {} jobs", jobs.size());
        return jobs.stream().map(job -> {
            boolean canApply = applicantId != null &&
                    "OPEN".equals(job.getStatus()) &&
                    !appliedJobIds.contains(job.getId());
            return new JobPostingDTO(job, canApply);
        }).collect(Collectors.toList());
    }

    public List<JobPostingDTO> getJobsByHr(String hrEmail, String title, String location, String category, String status) {
        logger.info("Fetching jobs for HR: {} with filters - title: {}, location: {}, category: {}, status: {}",
                hrEmail, title, location, category, status);

        if (hrEmail == null || hrEmail.trim().isEmpty()) {
            logger.error("HR email is null or empty");
            throw new IllegalArgumentException("HR email cannot be null or empty");
        }

        User hr = userRepository.findByEmail(hrEmail)
                .orElseThrow(() -> {
                    logger.error("HR user not found with email: {}", hrEmail);
                    return new RuntimeException("HR user not found");
                });

        Specification<JobPosting> spec = Specification.where((root, query, cb) ->
                cb.equal(root.get("hr").get("id"), hr.getId()));

        if (title != null && !title.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), "%" + title.trim().toLowerCase() + "%"));
        }
        if (location != null && !location.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("location"), location.trim()));
        }
        if (category != null && !category.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category"), category.trim()));
        }
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), status.trim().toUpperCase()));
        }

        List<JobPosting> jobs = jobRepository.findAll(spec);
        logger.debug("Retrieved {} jobs for HR: {}", jobs.size(), hrEmail);
        return jobs.stream().map(job -> new JobPostingDTO(job, false)).collect(Collectors.toList());
    }

    @Transactional
    public JobPostingDTO updateJob(Long id, JobPosting jobDetails, String hrEmail, String newImageUrl) {
        logger.info("Updating job with ID: {} by HR: {}", id, hrEmail);
        if (id == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        if (hrEmail == null || hrEmail.trim().isEmpty()) {
            logger.error("HR email is null or empty");
            throw new IllegalArgumentException("HR email cannot be null or empty");
        }

        JobPosting job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", id);
                    return new RuntimeException("Job not found");
                });
        User hr = userRepository.findByEmail(hrEmail)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", hrEmail);
                    return new RuntimeException("HR not found");
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", hrEmail);
            throw new RuntimeException("HR account is not approved by Super Admin");
        }
        if (!job.getHr().getEmail().equals(hrEmail)) {
            logger.warn("HR {} not authorized to update job with ID: {}", hrEmail, id);
            throw new RuntimeException("HR not authorized to update this job");
        }

        // Update job details
        if (jobDetails.getTitle() != null) job.setTitle(jobDetails.getTitle());
        if (jobDetails.getDescription() != null) job.setDescription(jobDetails.getDescription());
        if (jobDetails.getRequirements() != null) job.setRequirements(jobDetails.getRequirements());
        if (jobDetails.getSalary() != null) job.setSalary(jobDetails.getSalary());
        if (jobDetails.getLocation() != null) job.setLocation(jobDetails.getLocation());
        if (jobDetails.getCategory() != null) job.setCategory(jobDetails.getCategory());
        if (jobDetails.getStatus() != null) job.setStatus(jobDetails.getStatus());

        // Handle image update
        if (newImageUrl != null) {
            // Delete the old image if it exists and is not the default image
            if (job.getImageUrl() != null && !job.getImageUrl().equals("https://via.placeholder.com/300x200?text=Default+Job+Image")) {
                String oldImagePath = job.getImageUrl().replace("http://localhost:8080/", "");
                try {
                    Files.deleteIfExists(Paths.get(oldImagePath));
                    logger.info("Deleted old image file: {}", oldImagePath);
                } catch (Exception e) {
                    logger.error("Failed to delete old image file: {}: {}", oldImagePath, e.getMessage());
                }
            }
            job.setImageUrl(newImageUrl);
            logger.info("Updated image URL for job ID: {} to: {}", id, newImageUrl);
        }

        JobPosting updatedJob = jobRepository.save(job);
        logger.info("Job with ID: {} updated successfully", id);
        return new JobPostingDTO(updatedJob);
    }

    @Transactional
    public void deleteJob(Long id, String hrEmail) {
        logger.info("Deleting job with ID: {} by HR: {}", id, hrEmail);
        if (id == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        if (hrEmail == null || hrEmail.trim().isEmpty()) {
            logger.error("HR email is null or empty");
            throw new IllegalArgumentException("HR email cannot be null or empty");
        }

        JobPosting job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", id);
                    return new RuntimeException("Job not found");
                });
        User hr = userRepository.findByEmail(hrEmail)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", hrEmail);
                    return new RuntimeException("HR not found");
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", hrEmail);
            throw new RuntimeException("HR account is not approved by Super Admin");
        }
        if (!job.getHr().getEmail().equals(hrEmail)) {
            logger.warn("HR {} not authorized to delete job with ID: {}", hrEmail, id);
            throw new RuntimeException("HR not authorized to delete this job");
        }

        // Delete the image file if it exists and is not the default image
        if (job.getImageUrl() != null && !job.getImageUrl().equals("https://via.placeholder.com/300x200?text=Default+Job+Image")) {
            String imagePath = job.getImageUrl().replace("http://localhost:8080/", "");
            try {
                Files.deleteIfExists(Paths.get(imagePath));
                logger.info("Deleted image file: {}", imagePath);
            } catch (Exception e) {
                logger.error("Failed to delete image file: {}: {}", imagePath, e.getMessage());
            }
        }

        jobRepository.delete(job);
        logger.info("Job with ID: {} deleted successfully", id);
    }

    public List<JobPostingDTO> searchJobs(String title, String location, String category) {
        logger.info("Searching jobs with title: {}, location: {}, category: {}", title, location, category);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        User applicant = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        Long applicantId = (applicant != null && applicant.getRole() == User.Role.APPLICANT) ? applicant.getId() : null;

        Set<Long> appliedJobIds = applicantId != null ?
                jobApplicationRepository.findByApplicantId(applicantId)
                        .stream()
                        .map(app -> app.getJob().getId())
                        .collect(Collectors.toSet()) :
                Set.of();

        Specification<JobPosting> spec = Specification.where(null);
        if (title != null && !title.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), "%" + title.trim().toLowerCase() + "%"));
        }
        if (location != null && !location.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("location"), location.trim()));
        }
        if (category != null && !category.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category"), category.trim()));
        }
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("status"), "OPEN"));
        List<JobPosting> jobs = jobRepository.findAll(spec);
        logger.debug("Found {} jobs matching criteria", jobs.size());
        return jobs.stream().map(job -> {
            boolean canApply = applicantId != null &&
                    "OPEN".equals(job.getStatus()) &&
                    !appliedJobIds.contains(job.getId());
            return new JobPostingDTO(job, canApply);
        }).collect(Collectors.toList());
    }

    public JobPostingDTO getJobById(Long id) {
        logger.info("Fetching job with ID: {}", id);
        if (id == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }

        // Get the authenticated user's email and role
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean isApplicant = user != null && user.getRole() == User.Role.APPLICANT;
        Long applicantId = isApplicant ? user.getId() : null;

        // Fetch the job by ID
        JobPosting job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", id);
                    return new RuntimeException("Job not found");
                });

        // If the user is an applicant, prevent access to closed jobs
        if (isApplicant && !"OPEN".equalsIgnoreCase(job.getStatus())) {
            logger.warn("Applicant {} attempted to access closed job with ID: {}", email, id);
            throw new RuntimeException("This job is not available");
        }

        // Determine if the applicant can apply (only relevant for applicants)
        boolean canApply = applicantId != null &&
                "OPEN".equals(job.getStatus()) &&
                !jobApplicationRepository.existsByApplicantIdAndJobId(applicantId, job.getId());
        return new JobPostingDTO(job, canApply);
    }

    public List<JobPostingDTO> getActiveJobs() {
        logger.info("Fetching active jobs");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        User applicant = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        Long applicantId = (applicant != null && applicant.getRole() == User.Role.APPLICANT) ? applicant.getId() : null;

        Set<Long> appliedJobIds = applicantId != null ?
                jobApplicationRepository.findByApplicantId(applicantId)
                        .stream()
                        .map(app -> app.getJob().getId())
                        .collect(Collectors.toSet()) :
                Set.of();

        List<JobPosting> jobs = jobRepository.findByStatus("OPEN");
        logger.debug("Found {} active jobs", jobs.size());
        return jobs.stream().map(job -> {
            boolean canApply = applicantId != null &&
                    "OPEN".equals(job.getStatus()) &&
                    !appliedJobIds.contains(job.getId());
            return new JobPostingDTO(job, canApply);
        }).collect(Collectors.toList());
    }

    @Transactional
    public void closeJob(Long jobId) {
        logger.debug("Closing job with ID: {}", jobId);
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new RuntimeException("User not found");
                });
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new RuntimeException("Job not found with ID: " + jobId);
                });
        if (!user.getRole().equals(User.Role.SUPER_ADMIN) && !job.getHr().getEmail().equals(email)) {
            logger.warn("User {} not authorized to close job with ID: {}", email, jobId);
            throw new RuntimeException("Not authorized to close this job");
        }
        if ("CLOSE".equalsIgnoreCase(job.getStatus())) {
            logger.debug("Job with ID {} is already closed", jobId);
            return;
        }
        job.setStatus("CLOSE");
        jobRepository.save(job);
        logger.info("Job with ID {} closed (status set to CLOSE)", jobId);
    }

    @Transactional
    public JobPostingDTO toggleJobStatus(Long jobId, String hrEmail) {
        logger.info("Toggling status for job with ID: {} by HR: {}", jobId, hrEmail);
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        if (hrEmail == null || hrEmail.trim().isEmpty()) {
            logger.error("HR email is null or empty");
            throw new IllegalArgumentException("HR email cannot be null or empty");
        }

        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new RuntimeException("Job not found with ID: " + jobId);
                });
        User hr = userRepository.findByEmail(hrEmail)
                .orElseThrow(() -> {
                    logger.error("HR not found with email: {}", hrEmail);
                    return new RuntimeException("HR not found");
                });
        if (!hr.isApproved()) {
            logger.warn("HR account not approved for email: {}", hrEmail);
            throw new RuntimeException("HR account is not approved by Super Admin");
        }
        if (!hr.getRole().equals(User.Role.SUPER_ADMIN) && !job.getHr().getEmail().equals(hrEmail)) {
            logger.warn("HR {} not authorized to toggle status for job with ID: {}", hrEmail, jobId);
            throw new RuntimeException("Not authorized to toggle this job's status");
        }

        // Toggle the status
        if ("OPEN".equalsIgnoreCase(job.getStatus())) {
            job.setStatus("CLOSE");
            logger.info("Job with ID {} closed (status set to CLOSE)", jobId);
        } else {
            job.setStatus("OPEN");
            logger.info("Job with ID {} reopened (status set to OPEN)", jobId);
        }

        JobPosting updatedJob = jobRepository.save(job);
        return new JobPostingDTO(updatedJob);
    }

    @Transactional
    public void reopenJob(Long jobId) {
        logger.debug("Reopening job with ID: {}", jobId);
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new RuntimeException("User not found");
                });
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new RuntimeException("Job not found with ID: " + jobId);
                });
        if (!user.getRole().equals(User.Role.SUPER_ADMIN) && !job.getHr().getEmail().equals(email)) {
            logger.warn("User {} not authorized to reopen job with ID: {}", email, jobId);
            throw new RuntimeException("Not authorized to reopen this job");
        }
        if ("OPEN".equalsIgnoreCase(job.getStatus())) {
            logger.debug("Job with ID {} is already open", jobId);
            return;
        }
        job.setStatus("OPEN");
        jobRepository.save(job);
        logger.info("Job with ID {} reopened (status set to OPEN)", jobId);
    }

    public List<JobPosting> getAllJobs() {
        logger.debug("Fetching all jobs");
        return jobRepository.findAll();
    }

    private boolean isApplicant(Authentication auth) {
        return auth != null && auth.isAuthenticated() &&
                auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_APPLICANT"));
    }

    public JobPosting findById(Long id) {
        logger.debug("Finding job by ID: {}", id);
        if (id == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        return jobRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", id);
                    return new RuntimeException("Job not found");
                });
    }

    @Transactional
    public void deleteJobByAdmin(Long jobId) {
        logger.info("Admin deleting job with ID: {}", jobId);
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }

        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new RuntimeException("Job not found with ID: " + jobId);
                });

        // Delete the image file if it exists and is not the default image
        if (job.getImageUrl() != null && !job.getImageUrl().equals("https://via.placeholder.com/300x200?text=Default+Job+Image")) {
            String imagePath = job.getImageUrl().replace("http://localhost:8080/", "");
            try {
                Files.deleteIfExists(Paths.get(imagePath));
                logger.info("Deleted image file: {}", imagePath);
            } catch (Exception e) {
                logger.error("Failed to delete image file: {}: {}", imagePath, e.getMessage());
            }
        }

        jobRepository.delete(job);
        logger.info("Job with ID: {} deleted by admin", jobId);
    }

    @Transactional
    public ApplicationResponseDto applyForJob(Long jobId, String applicantEmail, MultipartFile resumeFile) throws IOException {
        logger.info("Processing application for jobId: {} by applicant: {}", jobId, applicantEmail);
        if (jobId == null) {
            logger.error("Job ID is null");
            throw new IllegalArgumentException("Job ID cannot be null");
        }
        if (applicantEmail == null || applicantEmail.trim().isEmpty()) {
            logger.error("Applicant email is null or empty");
            throw new IllegalArgumentException("Applicant email cannot be null or empty");
        }
        if (resumeFile == null || resumeFile.isEmpty()) {
            logger.error("Resume file is null or empty");
            throw new IllegalArgumentException("Resume file cannot be null or empty");
        }

        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    logger.error("Job not found with ID: {}", jobId);
                    return new RuntimeException("Job not found");
                });
        if (!"OPEN".equalsIgnoreCase(job.getStatus())) {
            logger.warn("Cannot apply for a closed job with ID: {}", jobId);
            throw new RuntimeException("Cannot apply for a closed job");
        }
        User applicant = userRepository.findByEmail(applicantEmail)
                .orElseThrow(() -> {
                    logger.error("Applicant not found with email: {}", applicantEmail);
                    return new RuntimeException("Applicant not found");
                });

        if (jobApplicationRepository.existsByApplicantIdAndJobId(applicant.getId(), jobId)) {
            logger.warn("Applicant {} has already applied to jobId: {}", applicantEmail, jobId);
            throw new RuntimeException("You have already applied to this job");
        }

        String fileName = UUID.randomUUID().toString() + "-" + resumeFile.getOriginalFilename();
        Path filePath = Paths.get(RESUME_UPLOAD_DIR, fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, resumeFile.getBytes());
        String resumeUrl = "http://localhost:8080/resumes/" + fileName;

        JobApplication application = new JobApplication();
        application.setApplicant(applicant);
        application.setJob(job);
        application.setResumeUrl(resumeUrl);
        application.setAppliedAt(LocalDateTime.now());
        application.setStatus(ApplicationStatus.PENDING);

        JobApplication savedApplication = jobApplicationRepository.save(application);
        logger.info("Application submitted successfully for jobId: {} by applicant: {}", jobId, applicantEmail);

        return new ApplicationResponseDto(
                savedApplication.getId(),
                savedApplication.getAppliedAt(),
                savedApplication.getStatus(),
                applicant.getId(),
                applicant.getFullName(),
                job.getId(),
                job.getTitle(),
                savedApplication.getResumeUrl()
        );
    }
}