package com.example.career_portal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"applicant_id", "job_id"}))
@Data
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt; // Removed default, set in service

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private JobPosting job;

    @Column(name = "resume_url", nullable = false) // Made non-nullable
    private String resumeUrl;
}