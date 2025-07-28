package com.example.career_portal.dto;

public class JobDto {
    private Long id;
    private UserDto hr;
    private String title;
    private String description;
    private String requirements;
    private Double salary;
    private String location;
    private String category;
    private String status;
    private String createdAt;
    private String imageUrl;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserDto getHr() { return hr; }
    public void setHr(UserDto hr) { this.hr = hr; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}