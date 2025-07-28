package com.example.career_portal.service;

import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.entity.User;
import com.example.career_portal.repository.ApplicantDetailsRepository;
import com.example.career_portal.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicantDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicantDetailsService.class);

    @Autowired
    private ApplicantDetailsRepository applicantDetailsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private static final String UPLOAD_DIR = "uploads/resumes/";

    @Transactional
    public ApplicantDetails createApplicantDetails(ApplicantDetails applicantDetails, MultipartFile resumeFile, String email) throws IOException {
        // Find the user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        // Merge the User to ensure it’s in the persistence context
        logger.debug("Merging User with ID: {}", user.getId());
        User managedUser = entityManager.merge(user);

        // Set the User and applicantId in ApplicantDetails
        applicantDetails.setUser(managedUser);
        applicantDetails.setApplicantId(managedUser.getId());

        // Check if ApplicantDetails already exists for this user
        Optional<ApplicantDetails> existingDetails = applicantDetailsRepository.findByUser(managedUser);
        if (existingDetails.isPresent()) {
            // Check if the associated User still exists
            Optional<User> existingUser = userRepository.findById(existingDetails.get().getApplicantId());
            if (!existingUser.isPresent()) {
                // If the User no longer exists, delete the orphaned ApplicantDetails
                logger.warn("Found orphaned ApplicantDetails for applicantId: {}. Deleting it.", existingDetails.get().getApplicantId());
                applicantDetailsRepository.delete(existingDetails.get());
            } else {
                logger.warn("ApplicantDetails already exists for user with email: {}", email);
                throw new DataIntegrityViolationException("Applicant details already exist for this user");
            }
        }

        // Handle resume file upload with a unique file name
        if (resumeFile != null && !resumeFile.isEmpty()) {
            String originalFileName = resumeFile.getOriginalFilename();
            String fileName = UUID.randomUUID().toString() + "-" + originalFileName;
            Path filePath = Paths.get(UPLOAD_DIR, fileName);
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, resumeFile.getBytes());
            applicantDetails.setResume("http://localhost:8080/resumes/" + fileName);
        }

        // Clear the session to avoid conflicts with stale objects
        entityManager.clear();

        // Save the ApplicantDetails
        logger.debug("Saving ApplicantDetails for user with ID: {}", managedUser.getId());
        ApplicantDetails savedDetails = applicantDetailsRepository.save(applicantDetails);
        logger.info("Created ApplicantDetails for user with email: {}", email);
        return savedDetails;
    }

    public ApplicantDetails getApplicantDetails(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return applicantDetailsRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Applicant details not found for " + email));
    }
}