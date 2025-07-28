package com.example.career_portal.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.repository.ApplicantDetailsRepository;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private static final String RESUME_UPLOAD_DIR = "uploads/resumes/";

    @Autowired
    private ApplicantDetailsRepository applicantDetailsRepository;

    @GetMapping("/resumes/{filename:.+}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('HR') or hasRole('APPLICANT')")
    public ResponseEntity<?> serveResume(@PathVariable String filename) {
        logger.debug("Serving resume file: {}", filename);

        // Get the authenticated user's email
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        String userRole = authentication.getAuthorities().iterator().next().getAuthority();

        try {
            // If the user is an applicant, verify they are accessing their own resume
            if ("ROLE_APPLICANT".equals(userRole)) {
                ApplicantDetails applicantDetails = applicantDetailsRepository.findByUserEmail(userEmail)
                        .orElse(null);
                if (applicantDetails == null || applicantDetails.getResume() == null) {
                    logger.warn("No resume found for applicant: {}", userEmail);
                    return ResponseEntity.status(404)
                            .body(Map.of("error", "No resume found for user: " + userEmail));
                }

                String resumeUrl = applicantDetails.getResume();
                String storedFilename = resumeUrl.substring(resumeUrl.lastIndexOf('/') + 1);
                if (!filename.equals(storedFilename)) {
                    logger.warn("Applicant {} attempted to access unauthorized resume: {}", userEmail, filename);
                    return ResponseEntity.status(403)
                            .body(Map.of("error", "You are not authorized to access this resume"));
                }
            }

            // Serve the file
            Path filePath = Paths.get(RESUME_UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                logger.warn("Resume file not found: {}", filename);
                return ResponseEntity.status(404)
                        .body(Map.of("error", "Resume file not found: " + filename));
            }
            if (!resource.isReadable()) {
                logger.warn("Resume file is not readable: {}", filename);
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Resume file is not readable: " + filename));
            }

            String contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".doc")) {
                contentType = "application/msword";
            } else if (filename.toLowerCase().endsWith(".docx")) {
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }

            logger.info("Successfully served resume file: {}", filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(resource.contentLength()))
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error serving resume file {}: {}", filename, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to serve resume: " + e.getMessage()));
        }
    }
}