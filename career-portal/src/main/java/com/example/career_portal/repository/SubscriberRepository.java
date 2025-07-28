// src/main/java/com/example/career_portal/repository/SubscriberRepository.java
package com.example.career_portal.repository;

import com.example.career_portal.entity.Subscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {
    Optional<Subscriber> findByEmail(String email);
}