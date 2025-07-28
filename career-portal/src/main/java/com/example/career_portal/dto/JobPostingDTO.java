package com.example.career_portal.dto;

import com.example.career_portal.entity.JobPosting;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobPostingDTO {
    private Long id;
    private Long hrId;
    private String title;
    private String description;
    private String requirements;
    private BigDecimal salary;
    private String location;
    private String category;
    private String status;
    private String imageUrl;
    private LocalDateTime createdAt;
    private boolean canApply; // Added for apply button visibility

    // Default constructor (required by Jackson)
    public JobPostingDTO() {
    }

    // Constructor for HR-related methods (no canApply needed)
    public JobPostingDTO(JobPosting job) {
        this.id = job.getId();
        this.hrId = job.getHr().getId();
        this.title = job.getTitle();
        this.description = job.getDescription();
        this.requirements = job.getRequirements();
        this.salary = job.getSalary();
        this.location = job.getLocation();
        this.category = job.getCategory();
        this.status = job.getStatus();
        this.imageUrl = job.getImageUrl();
        this.createdAt = job.getCreatedAt();
        this.canApply = false; // Default to false, not relevant for HR operations
    }

    // Constructor for listing methods (with canApply)
    public JobPostingDTO(JobPosting job, boolean canApply) {
        this.id = job.getId();
        this.hrId = job.getHr().getId();
        this.title = job.getTitle();
        this.description = job.getDescription();
        this.requirements = job.getRequirements();
        this.salary = job.getSalary();
        this.location = job.getLocation();
        this.category = job.getCategory();
        this.status = job.getStatus();
        this.imageUrl = job.getImageUrl();
        this.createdAt = job.getCreatedAt();
        this.canApply = canApply; // Set based on authentication
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHrId() { return hrId; }
    public void setHrId(Long hrId) { this.hrId = hrId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isCanApply() { return canApply; }
    public void setCanApply(boolean canApply) { this.canApply = canApply; }
}