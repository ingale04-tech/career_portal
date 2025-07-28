package com.example.career_portal.repository;

import com.example.career_portal.entity.ApplicationStatus;
import com.example.career_portal.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByApplicantIdAndJobId(Long applicantId, Long jobId);
    List<JobApplication> findByApplicantId(Long applicantId);
    List<JobApplication> findByJobId(Long jobId);
    List<JobApplication> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
    List<JobApplication> findByJobIdInAndStatus(List<Long> jobIds, ApplicationStatus status);

    // Added: Custom method for finding applications by a list of job IDs
    List<JobApplication> findByJobIdIn(List<Long> jobIds);

    // Added: Custom method to delete applications by job ID
    @Modifying
    @Query("DELETE FROM JobApplication a WHERE a.job.id = :jobId")
    void deleteByJobId(Long jobId);

    // Updated: Fixed method name to match the entity structure
    long countByApplicantId(Long applicantId);
    long countByJobId(Long jobId);

    void deleteByApplicantId(Long applicantId);
}