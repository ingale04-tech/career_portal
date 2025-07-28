package com.example.career_portal.config;

import com.example.career_portal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

import static org.springframework.http.HttpMethod.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserService userService;

    @Autowired
    public SecurityConfig(UserService userService) {
        this.userService = userService;
        System.out.println("SecurityConfig constructor called");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtRequestFilter jwtRequestFilter) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/register/hr", "/api/auth/register/applicant").permitAll()
                        .requestMatchers("/api/subscribe").permitAll()
                        .requestMatchers(GET, "/api/jobs/all", "/api/jobs/search", "/api/jobs/active").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/register/hr", "/api/auth/register/applicant",
                                "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()

                        .requestMatchers("/uploads/**").permitAll()
                        // Authenticated endpoints
                        .requestMatchers(PUT, "/api/auth/update-profile").authenticated()
                        .requestMatchers(GET, "/api/jobs/{id}").authenticated()
                        // Super Admin only
                        .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
                        // HR-specific endpoints
                        .requestMatchers("/api/hr-details/**").hasRole("HR")
                        .requestMatchers(POST, "/api/jobs/create").hasRole("HR")
                        .requestMatchers(PUT, "/api/jobs/**").hasRole("HR")
                        .requestMatchers(DELETE, "/api/jobs/**").hasRole("HR")
                        .requestMatchers(GET, "/api/jobs/my-jobs").hasRole("HR")
                        .requestMatchers("/api/applications/job/**").hasRole("HR")
                        .requestMatchers("/api/applications/*/status").hasRole("HR")
                        .requestMatchers("/api/applications/job/*/filter").hasRole("HR")
                        .requestMatchers("/api/applications/report/**").hasAnyRole("HR", "SUPER_ADMIN")
                        // Applicant-specific endpoints
                        .requestMatchers("/api/applications/apply/**").hasRole("APPLICANT")
                        .requestMatchers("/api/applications/my-applications").hasRole("APPLICANT")
                        .requestMatchers("/api/applicant/**").hasRole("APPLICANT")
                        // FileController endpoint for resumes - Allow authenticated users, let @PreAuthorize handle role restrictions
                        .requestMatchers("/resumes/**").authenticated()
                        // Handle OPTIONS requests for preflight (CORS)
                        .requestMatchers(OPTIONS, "/**").permitAll()
                        // Catch-all
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write(
                                    "{\"error\": \"You need to first login or register yourself in this web application\"}"
                            );
                        })
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return userService;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}