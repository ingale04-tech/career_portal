package com.example.career_portal.dto;

import lombok.Data;

@Data
public class HiringReportDTO {
    private Long jobId;
    private String jobTitle;
    private int totalApplications;
    private int pending;
    private int shortlisted;
    private int rejected;
    private int hired;
}