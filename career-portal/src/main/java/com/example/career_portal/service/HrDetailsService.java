package com.example.career_portal.service;

import com.example.career_portal.dto.HrDetailsResponse;
import com.example.career_portal.entity.HrDetails;
import com.example.career_portal.entity.User;
import com.example.career_portal.repository.HrDetailsRepository;
import com.example.career_portal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HrDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(HrDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HrDetailsRepository hrDetailsRepository;

    @Transactional
    public void createOrUpdateHrDetails(String email, String companyName, String designation) {
        logger.debug("Processing HR details for email: {}, companyName={}, designation={}", email, companyName, designation);

        if (companyName == null || companyName.trim().isEmpty()) {
            logger.error("Company name is required for email: {}", email);
            throw new RuntimeException("Company name is required");
        }
        if (designation == null || designation.trim().isEmpty()) {
            logger.error("Designation is required for email: {}", email);
            throw new RuntimeException("Designation is required");
        }

        try {
            User hr = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("HR not found for email: {}", email);
                        return new RuntimeException("HR not found");
                    });

            logger.debug("Found HR user with ID: {} for email: {}", hr.getId(), email);

            HrDetails hrDetails = hrDetailsRepository.findByHrId(hr.getId())
                    .orElse(new HrDetails(hr, companyName, designation));
            hrDetails.setHr(hr);
            hrDetails.setCompanyName(companyName);
            hrDetails.setDesignation(designation);

            logger.debug("Saving HR details for email: {}", email);
            hrDetailsRepository.save(hrDetails);
            logger.info("HR details saved successfully for email: {}", email);
        } catch (DataIntegrityViolationException e) {
            logger.error("Database constraint violation for email: {}", email, e);
            throw new RuntimeException("Database constraint violation: " + e.getMessage(), e);
        } catch (OptimisticLockingFailureException e) {
            logger.error("Concurrent update detected for HR details of email: {}", email, e);
            throw new RuntimeException("Another update occurred. Please try again.", e);
        } catch (Exception e) {
            logger.error("Failed to save HR details for email: {}", email, e);
            throw new RuntimeException("Failed to save HR details: " + e.getMessage(), e);
        }
    }

    public HrDetailsResponse getHrDetails(String email) {
        logger.debug("Fetching HR details for email: {}", email);
        User hr = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("HR not found for email: {}", email);
                    return new RuntimeException("HR not found");
                });

        HrDetails hrDetails = hrDetailsRepository.findByHrId(hr.getId())
                .orElse(new HrDetails());
        return new HrDetailsResponse(
                hrDetails.getCompanyName() != null ? hrDetails.getCompanyName() : "N/A",
                hrDetails.getDesignation() != null ? hrDetails.getDesignation() : "N/A"
        );
    }
}