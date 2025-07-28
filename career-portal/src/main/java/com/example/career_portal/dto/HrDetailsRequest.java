package com.example.career_portal.dto;

public class HrDetailsRequest {
    private String companyName;
    private String designation;

    // Default constructor (required for deserialization)
    public HrDetailsRequest() {
    }

    // Constructor
    public HrDetailsRequest(String companyName, String designation) {
        this.companyName = companyName;
        this.designation = designation;
    }

    // Getters and Setters
    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }
}