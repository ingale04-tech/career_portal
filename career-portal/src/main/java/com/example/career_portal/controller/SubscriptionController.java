// src/main/java/com/example/career_portal/controller/SubscriptionController.java
package com.example.career_portal.controller;

import com.example.career_portal.entity.Subscriber;
import com.example.career_portal.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(@Valid @RequestBody Subscriber subscriber) {
        String message = subscriptionService.subscribe(subscriber.getEmail());
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return ResponseEntity.ok(response);
    }
}