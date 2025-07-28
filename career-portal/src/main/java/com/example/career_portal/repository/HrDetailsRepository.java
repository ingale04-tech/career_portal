package com.example.career_portal.repository;

import com.example.career_portal.entity.HrDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HrDetailsRepository extends JpaRepository<HrDetails, Long> {
    Optional<HrDetails> findByHrId(Long hrId);
}