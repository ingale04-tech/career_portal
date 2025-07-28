package com.example.career_portal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hr_id", nullable = true)
    private User hr;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String requirements;

    @Column(nullable = false)
    private BigDecimal salary;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String category; // Changed back to String to match database

    @Column(nullable = false)
    private String status = "OPEN";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "image_url")
    private String imageUrl;

    @PrePersist
    private void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "OPEN";
        }
    }
}