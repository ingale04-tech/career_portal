package com.example.career_portal.repository;

import com.example.career_portal.entity.JobPosting;
import com.example.career_portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long>, JpaSpecificationExecutor<JobPosting> {
    List<JobPosting> findByHr(User hr);
    List<JobPosting> findByStatus(String status);
    List<JobPosting> findByTitleContainingIgnoreCase(String title);
    List<JobPosting> findByHrId(Long hrId);
    @Query("SELECT DISTINCT j.category FROM JobPosting j WHERE j.category IS NOT NULL")
    List<String> findDistinctCategories();
    long countByHrId(Long hrId);

}