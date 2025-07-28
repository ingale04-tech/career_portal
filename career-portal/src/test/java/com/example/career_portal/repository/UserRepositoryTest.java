package com.example.career_portal.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class UserRepositoryTest {
    @Autowired
    private UserRepository userRepository;


    @Test
    public void testFindDistinctCategories() {
        List<String> categories = userRepository.findDistinctCategories();
        assertNotNull(categories);
        System.out.println("Distinct categories: " + categories);
    }
}