package com.example.career_portal.dto;

public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private Long applicantId; // Optional: if you want to include it
    private String skill; // Added from ApplicantDetails

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getApplicantId() { return applicantId; }
    public void setApplicantId(Long applicantId) { this.applicantId = applicantId; }
    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }
}