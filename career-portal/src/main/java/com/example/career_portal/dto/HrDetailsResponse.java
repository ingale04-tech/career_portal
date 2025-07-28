package com.example.career_portal.dto;

public class HrDetailsResponse {
    private String companyName;
    private String designation;

    // Constructor
    public HrDetailsResponse(String companyName, String designation) {
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