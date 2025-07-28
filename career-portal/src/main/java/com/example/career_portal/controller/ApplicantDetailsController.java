package com.example.career_portal.controller;

import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.service.ApplicantDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/applicant-details")
public class ApplicantDetailsController {

    @Autowired
    private ApplicantDetailsService applicantDetailsService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<ApplicantDetails> createApplicantDetails(
            @RequestPart("details") ApplicantDetails applicantDetails,
            @RequestPart(value = "resumeFile", required = false) MultipartFile resumeFile) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ApplicantDetails createdDetails = applicantDetailsService.createApplicantDetails(applicantDetails, resumeFile, email);
        return ResponseEntity.ok(createdDetails);
    }

    @GetMapping
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<ApplicantDetails> getApplicantDetails() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ApplicantDetails details = applicantDetailsService.getApplicantDetails(email);
        return ResponseEntity.ok(details);
    }
}