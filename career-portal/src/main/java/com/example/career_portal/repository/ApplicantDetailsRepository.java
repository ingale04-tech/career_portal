package com.example.career_portal.repository;

import com.example.career_portal.entity.ApplicantDetails;
import com.example.career_portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApplicantDetailsRepository extends JpaRepository<ApplicantDetails, Long> {

    // Find by applicantId (which is the same as user.id due to @MapsId)
    Optional<ApplicantDetails> findByApplicantId(Long applicantId);

    // Find by User entity directly (preferred for type safety)
    Optional<ApplicantDetails> findByUser(User user);

    // Find by user.id (alternative if needed)
    @Query("SELECT ad FROM ApplicantDetails ad WHERE ad.user.id = :userId")
    Optional<ApplicantDetails> findByUserId(@Param("userId") Long userId);

    // Find by user.email
    @Query("SELECT ad FROM ApplicantDetails ad WHERE ad.user.email = :email")
    Optional<ApplicantDetails> findByUserEmail(@Param("email") String email);
}