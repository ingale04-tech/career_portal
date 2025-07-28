package com.example.career_portal.config;

import io.jsonwebtoken.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtil {
    private final String SECRET_KEY = "A7ZgYYCcSULMwKDK646QmlEoG+NYbkG9qmMike/MXdw=";
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours

    public String extractEmail(String token) {
        return Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody().getSubject();
    }

    public List<String> extractRoles(String token) {
        Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody();
        return claims.get("roles", List.class);
    }

    public boolean isApproved(String token) {
        Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody();
        return claims.get("approved", Boolean.class);
    }

    // For filter compatibility with UserDetails
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // For registration/login with email
    public boolean validateToken(String token, String email) {
        try {
            String tokenEmail = extractEmail(token);
            return tokenEmail.equals(email) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody().getExpiration();
        return expiration.before(new Date());
    }

    public String generateToken(String email, String role, boolean isApproved) {
        Date now = new Date();
        System.out.println("JVM Time: " + now); // Debugging line
        return Jwts.builder()
                .setSubject(email)
                .claim("roles", List.of("ROLE_" + role))
                .claim("approved", isApproved)
                .setIssuedAt(now)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

    // Deprecated method for compatibility
    public String generateToken(String email, Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        Date now = new Date();
        System.out.println("JVM Time: " + now); // Debugging line
        return Jwts.builder()
                .setSubject(email)
                .claim("roles", roles)
                .setIssuedAt(now)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }
}