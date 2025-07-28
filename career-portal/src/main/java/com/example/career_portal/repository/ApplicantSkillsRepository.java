package com.example.career_portal.repository;

import com.example.career_portal.entity.ApplicantSkills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicantSkillsRepository extends JpaRepository<ApplicantSkills, Long> {

    // Method to find all skills for a given applicant_id
    List<ApplicantSkills> findByApplicantApplicantId(Long applicantId);

    // Method to delete all skills for a given applicant_id
    void deleteByApplicantApplicantId(Long applicantId);

    // Method to find all skills for a given user_id
    List<ApplicantSkills> findByUserId(Long userId);

    // Method to delete all skills for a given user_id
    void deleteByUserId(Long userId);

    // Method for case-insensitive duplicate check (already present)
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM ApplicantSkills s " +
            "WHERE s.applicant.applicantId = :applicantId " +
            "AND LOWER(s.skill) = LOWER(:skill)")
    boolean existsByApplicantApplicantIdAndSkill(@Param("applicantId") Long applicantId, @Param("skill") String skill);
}