package com.example.career_portal.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "applicant_skills")
@Data
public class ApplicantSkills {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private ApplicantDetails applicant;

    @Column(nullable = false)
    private String skill;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}