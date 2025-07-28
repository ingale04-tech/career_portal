package com.example.career_portal.service;

import com.example.career_portal.entity.*;
import com.example.career_portal.exception.UserDeletionException;
import com.example.career_portal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final ApplicantDetailsRepository applicantDetailsRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicantSkillsRepository applicantSkillsRepository; // Add this

    @Autowired
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetTokenRepository tokenRepository,
            ApplicantDetailsRepository applicantDetailsRepository,
            JobPostingRepository jobPostingRepository,
            JobApplicationRepository jobApplicationRepository,
            ApplicantSkillsRepository applicantSkillsRepository) { // Add this
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.applicantDetailsRepository = applicantDetailsRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.applicantSkillsRepository = applicantSkillsRepository;
        logger.info("UserService initialized");
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.debug("Loading user by email: {}", email);
        if (email == null || email.trim().isEmpty()) {
            logger.warn("Email is null or empty");
            throw new UsernameNotFoundException("Email cannot be null or empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.info("User not found for email: {}", email);
                    return new UsernameNotFoundException("User not found: " + email);
                });

        logger.debug("User role: {}", user.getRole());

        if (user.getRole() == User.Role.HR && !user.isApproved()) {
            logger.info("HR user {} is not approved", email);
            throw new AccessDeniedException("HR not approved: " + email);
        }

        logger.debug("User {} loaded with role: {}", email, user.getRole());
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    @Transactional
    public User save(User user) {
        if (user == null) {
            logger.warn("Attempted to save null user");
            throw new IllegalArgumentException("User cannot be null");
        }
        logger.debug("Saving user: {}", user.getEmail());
        User savedUser = userRepository.save(user);
        logger.info("User saved: {}", savedUser.getEmail());
        return savedUser;
    }

    @Transactional
    public User createUser(String fullName, String email, String password, String phone, User.Role role) {
        logger.debug("Creating user with email: {}", email);
        if (fullName == null || email == null || password == null || phone == null || role == null) {
            logger.warn("Invalid input for user creation: fullName={}, email={}, password={}, phone={}, role={}",
                    fullName, email, password, phone, role);
            throw new IllegalArgumentException("All fields are required");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            logger.warn("Email already exists: {}", email);
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setRole(role);
        user.setIsApproved(role == User.Role.APPLICANT); // Auto-approve applicants
        user.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        logger.info("User created: {}", email);

        // Auto-create ApplicantDetails for APPLICANT role
        if (role == User.Role.APPLICANT) {
            ApplicantDetails applicantDetails = new ApplicantDetails();
            applicantDetails.setUser(savedUser);
            applicantDetails.setApplicantId(savedUser.getId()); // Matches user.id due to @MapsId
            applicantDetails.setSkill(""); // Default empty value
            applicantDetails.setExperience(null); // Default null value
            applicantDetails.setLinkedin(""); // Default empty value
            applicantDetails.setPortfolio(""); // Default empty value
            applicantDetails.setResume(""); // Default empty value
            applicantDetailsRepository.save(applicantDetails);
            logger.info("ApplicantDetails created for userId: {}", savedUser.getId());
        }

        return savedUser;
    }

    @Transactional
    public User approveHr(Long hrId, String superAdminEmail) {
        logger.debug("Approving HR ID: {} by Super Admin: {}", hrId, superAdminEmail);
        if (hrId == null || superAdminEmail == null || superAdminEmail.trim().isEmpty()) {
            logger.warn("Invalid input: hrId={}, superAdminEmail={}", hrId, superAdminEmail);
            throw new IllegalArgumentException("HR ID and Super Admin email must not be null or empty");
        }

        User superAdmin = userRepository.findByEmail(superAdminEmail)
                .orElseThrow(() -> {
                    logger.info("Super Admin not found: {}", superAdminEmail);
                    return new IllegalArgumentException("Super Admin not found: " + superAdminEmail);
                });

        if (superAdmin.getRole() != User.Role.SUPER_ADMIN) {
            logger.warn("User {} is not a Super Admin", superAdminEmail);
            throw new AccessDeniedException("Only Super Admin can approve HR");
        }

        User hr = userRepository.findById(hrId)
                .orElseThrow(() -> {
                    logger.info("HR not found: {}", hrId);
                    return new IllegalArgumentException("HR not found: " + hrId);
                });

        if (hr.getRole() != User.Role.HR) {
            logger.warn("User ID {} is not HR, role: {}", hrId, hr.getRole());
            throw new IllegalArgumentException("User is not an HR: " + hrId);
        }

        if (hr.isApproved()) {
            logger.info("HR {} is already approved", hr.getEmail());
            return hr; // No change needed
        }

        hr.setIsApproved(true);
        User approvedHr = userRepository.save(hr);
        logger.info("HR {} approved by Super Admin {}", hr.getEmail(), superAdminEmail);
        return approvedHr;
    }

    @Transactional
    public void disableHr(Long hrId, String superAdminEmail) {
        logger.debug("Disabling HR ID: {} by Super Admin: {}", hrId, superAdminEmail);
        if (hrId == null || superAdminEmail == null || superAdminEmail.trim().isEmpty()) {
            logger.warn("Invalid input: hrId={}, superAdminEmail={}", hrId, superAdminEmail);
            throw new IllegalArgumentException("HR ID and Super Admin email must not be null or empty");
        }

        User superAdmin = userRepository.findByEmail(superAdminEmail)
                .orElseThrow(() -> {
                    logger.info("Super Admin not found: {}", superAdminEmail);
                    return new IllegalArgumentException("Super Admin not found: " + superAdminEmail);
                });

        if (superAdmin.getRole() != User.Role.SUPER_ADMIN) {
            logger.warn("User {} is not a Super Admin", superAdminEmail);
            throw new AccessDeniedException("Only Super Admin can disable HR");
        }

        User hr = userRepository.findById(hrId)
                .orElseThrow(() -> {
                    logger.info("HR not found: {}", hrId);
                    return new IllegalArgumentException("HR not found: " + hrId);
                });

        if (hr.getRole() != User.Role.HR) {
            logger.warn("User ID {} is not HR, role: {}", hrId, hr.getRole());
            throw new IllegalArgumentException("User is not an HR: " + hrId);
        }

        if (!hr.isApproved()) {
            logger.info("HR {} is already disabled", hr.getEmail());
            return; // No change needed
        }

        hr.setIsApproved(false);
        userRepository.save(hr);
        logger.info("HR {} disabled by Super Admin {}", hr.getEmail(), superAdminEmail);
    }

    public Optional<User> findByEmail(String email) {
        logger.debug("Finding user by email: {}", email);
        if (email == null || email.trim().isEmpty()) {
            logger.warn("Email is null or empty");
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User updateUserProfile(String password, String phone) {
        logger.debug("Updating user profile");
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.info("User not found: {}", email);
                    return new RuntimeException("User not found");
                });

        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
            logger.debug("Password updated for user: {}", email);
        }
        if (phone != null && !phone.trim().isEmpty()) {
            user.setPhone(phone);
            logger.debug("Phone updated for user: {}", email);
        }

        User updatedUser = userRepository.save(user);
        logger.info("Profile updated for user: {}", email);
        return updatedUser;
    }

    @Transactional
    public String createPasswordResetToken(String email) {
        logger.debug("Creating password reset token for email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.info("User not found: {}", email);
                    return new UsernameNotFoundException("User not found: " + email);
                });

        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(24);
        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);

        tokenRepository.save(resetToken);
        logger.info("Password reset token created for: {}", email);
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        logger.debug("Resetting password with token: {}", token);
        if (token == null || newPassword == null || newPassword.trim().isEmpty()) {
            logger.warn("Invalid token or password: token={}, newPassword={}", token, newPassword);
            throw new IllegalArgumentException("Token and new password must not be null or empty");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    logger.info("Invalid reset token: {}", token);
                    return new IllegalArgumentException("Invalid reset token");
                });

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            logger.warn("Reset token expired: {}", token);
            throw new IllegalArgumentException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
        logger.info("Password reset for: {}", user.getEmail());
    }

    public List<User> findAllUsers() {
        logger.debug("Fetching all users");
        List<User> users = userRepository.findAll();
        logger.info("Retrieved {} users", users.size());
        return users;
    }

    public Optional<User> findById(Long id) {
        logger.debug("Finding user by ID: {}", id);
        if (id == null) {
            logger.warn("ID is null");
            return Optional.empty();
        }
        return userRepository.findById(id);
    }
    @Transactional
    public void deleteUser(Long userId) {
        logger.debug("Deleting user ID: {}", userId);
        if (userId == null) {
            logger.warn("User ID is null");
            throw new IllegalArgumentException("User ID cannot be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.info("User not found: {}", userId);
                    return new IllegalArgumentException("User not found: " + userId);
                });

        // Ensure only APPLICANT users can be deleted
        if (user.getRole() != User.Role.APPLICANT) {
            logger.warn("Attempted to delete a non-applicant user with ID: {}", userId);
            throw new IllegalArgumentException("Only APPLICANT users can be deleted");
        }

        // Delete related ApplicantSkills (by applicant_id and user_id)
        List<ApplicantSkills> applicantSkillsByApplicant = applicantSkillsRepository.findByApplicantApplicantId(userId);
        if (!applicantSkillsByApplicant.isEmpty()) {
            applicantSkillsRepository.deleteByApplicantApplicantId(userId);
            logger.debug("Deleted {} ApplicantSkills records (by applicant_id) for user ID: {}", applicantSkillsByApplicant.size(), userId);
        }

        List<ApplicantSkills> applicantSkillsByUser = applicantSkillsRepository.findByUserId(userId);
        if (!applicantSkillsByUser.isEmpty()) {
            applicantSkillsRepository.deleteByUserId(userId);
            logger.debug("Deleted {} ApplicantSkills records (by user_id) for user ID: {}", applicantSkillsByUser.size(), userId);
        }

        // Delete related ApplicantDetails
        applicantDetailsRepository.findById(userId).ifPresent(details -> {
            applicantDetailsRepository.delete(details);
            logger.debug("Deleted ApplicantDetails for user ID: {}", userId);
        });

        // Delete any associated password reset tokens
        tokenRepository.findByUserId(userId).ifPresent(token -> {
            tokenRepository.delete(token);
            logger.debug("Deleted PasswordResetToken for user ID: {}", userId);
        });

        // Delete related JobApplications where the user is the applicant
        List<JobApplication> jobApplications = jobApplicationRepository.findByApplicantId(userId);
        if (!jobApplications.isEmpty()) {
            jobApplicationRepository.deleteByApplicantId(userId);
            logger.debug("Deleted {} JobApplication records for user ID: {}", jobApplications.size(), userId);
        }

        // Proceed with user deletion
        userRepository.deleteById(userId);
        logger.info("User ID {} (role: {}) deleted", userId, user.getRole());
    }
}