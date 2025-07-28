package com.example.career_portal.config;

import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.example.career_portal.service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtRequestFilter.class);

    private final JwtUtil jwtUtil;
    private final UserService userService;

    public JwtRequestFilter(JwtUtil jwtUtil, @Lazy UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        final String authorizationHeader = request.getHeader("Authorization");
        String path = request.getServletPath();
        logger.debug("Processing request for path: {}", path);

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            logger.debug("No valid Bearer token found in Authorization header for path: {}", path);
            chain.doFilter(request, response);
            return;
        }

        String jwt = authorizationHeader.substring(7);
        String email = null;

        try {
            email = jwtUtil.extractEmail(jwt);
            logger.debug("Extracted email from JWT: {}", email);
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token expired for request: {}", path);
            chain.doFilter(request, response);
            return;
        } catch (Exception e) {
            logger.error("Error extracting email from JWT for request: {}: {}", path, e.getMessage());
            chain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.debug("Validating token for email: {}", email);
            try {
                UserDetails userDetails = userService.loadUserByUsername(email);
                logger.debug("Loaded UserDetails: {}", userDetails);
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    List<String> roles = jwtUtil.extractRoles(jwt);
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set for email: {} with roles: {}", email, roles);
                } else {
                    logger.warn("Token validation failed for email: {}", email);
                }
            } catch (Exception e) {
                logger.error("Error during token validation or authentication setup for email: {}: {}", email, e.getMessage());
            }
        } else if (email == null) {
            logger.warn("No email extracted from JWT for request: {}", path);
        }

        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        boolean skip = path.equals("/api/auth/login") ||
                path.equals("/api/auth/register/hr") ||
                path.equals("/api/auth/register/applicant") ||
                path.equals("/api/auth/forgot-password") ||
                path.equals("/api/auth/reset-password");
        if (skip) {
            logger.debug("Skipping JWT filter for path: {}", path);
        }
        return skip;
    }
}