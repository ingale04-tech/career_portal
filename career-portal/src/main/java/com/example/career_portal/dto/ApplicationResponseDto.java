package com.example.career_portal.dto;

import com.example.career_portal.entity.ApplicationStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import java.time.LocalDateTime;

public class ApplicationResponseDto {
    private Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    private LocalDateTime appliedAt;

    private String status;
    private Long applicantId;
    private String applicantName;
    private Long jobId;
    private String jobTitle;
    private String resumeUrl;

    // Default constructor (required by Jackson)
    public ApplicationResponseDto() {
    }

    // Constructor to map from JobApplication entity
    public ApplicationResponseDto(Long id, LocalDateTime appliedAt, ApplicationStatus status,
                                  Long applicantId, String applicantName,
                                  Long jobId, String jobTitle, String resumeUrl) {
        this.id = id;
        this.appliedAt = appliedAt;
        this.status = status != null ? status.name() : null;
        this.applicantId = applicantId;
        this.applicantName = applicantName;
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.resumeUrl = resumeUrl;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // Overloaded setter to accept ApplicationStatus and convert to String
    public void setStatus(ApplicationStatus status) {
        this.status = status != null ? status.name() : null;
    }

    public Long getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(Long applicantId) {
        this.applicantId = applicantId;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }
}