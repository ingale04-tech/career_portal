// src/main/java/com/example/career_portal/service/SubscriptionService.java
package com.example.career_portal.service;

import com.example.career_portal.entity.Subscriber;
import com.example.career_portal.repository.SubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {

    @Autowired
    private SubscriberRepository subscriberRepository;

    public String subscribe(String email) {
        // Validate email
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Simple email format validation (already handled by @Email, but kept for additional safety)
        if (!email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check if email already exists
        if (subscriberRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already subscribed");
        }

        // Save the subscriber
        Subscriber subscriber = new Subscriber();
        subscriber.setEmail(email);
        subscriberRepository.save(subscriber);

        return "Subscribed successfully!";
    }
}