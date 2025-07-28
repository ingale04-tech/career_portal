package com.example.career_portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "applicant_details")
@Getter
@Setter
public class ApplicantDetails {

    @Id
    @Column(name = "applicant_id")
    private Long applicantId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "applicant_id")
    private User user;

    @Column(name = "skill")
    private String skill;

    @Column(name = "experience")
    private Integer experience;

    @Column(name = "linkedin")
    private String linkedin;

    @Column(name = "portfolio")
    private String portfolio;

    @Column(name = "resume")
    private String resume;

    @Version
    @Column(name = "version")
    private Long version; // Add this field for optimistic locking

    // Constructors
    public ApplicantDetails() {}

    public ApplicantDetails(User user, String skill, Integer experience, String linkedin, String portfolio, String resume) {
        this.user = user;
        this.applicantId = user.getId();
        this.skill = skill;
        this.experience = experience;
        this.linkedin = linkedin;
        this.portfolio = portfolio;
        this.resume = resume;
    }
}