package com.example.career_portal.repository;

import com.example.career_portal.entity.User;
import com.example.career_portal.entity.User.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);  // Define this method
    @Query("SELECT DISTINCT u.category FROM User u WHERE u.category IS NOT NULL")
    List<String> findDistinctCategories();
}