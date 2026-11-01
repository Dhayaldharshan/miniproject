package com.crisissync.controller;

import com.crisissync.dto.AuthResponse;
import com.crisissync.dto.SignInRequest;
import com.crisissync.dto.SignUpRequest;
import com.crisissync.security.JwtTokenProvider;
import com.crisissync.service.AuthService;
import com.crisissync.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signIn(@Valid @RequestBody SignInRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        String origin = httpRequest.getHeader("Origin");
        System.out.println("[AUTH-CONTROLLER] Incoming signin: ID/Email='" + request.getEmail()
                + "', Role='" + request.getAccountType()
                + "', PasswordLength=" + (request.getPassword() != null ? request.getPassword().length() : 0)
                + ""
                + ", Origin=" + origin
                + ", RemoteAddr=" + httpRequest.getRemoteAddr());
        AuthResponse response = authService.signIn(request);
        System.out.println("[AUTH-CONTROLLER] Authentication SUCCESS for: " + response.getEmail() + " (" + response.getRole() + ")");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/reset-admin")
    public ResponseEntity<Map<String, Object>> resetAdmin() {
        User admin = authService.initializeOrResetDefaultAdmin();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Default Administrator account verified and initialized successfully.",
                "adminId", admin.getId(),
                "email", admin.getEmail(),
                "role", admin.getRole(),
                "defaultCredentials", "Admin ID: usr-admin-01 | Email: admin@crisis-sync.gov | Password: Admin@123"
        ));
    }

    @PostMapping("/init-admin")
    public ResponseEntity<Map<String, Object>> initAdmin() {
        return resetAdmin();
    }

    @PostMapping("/admin-provision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuthResponse> provisionAdmin(@Valid @RequestBody SignUpRequest request, Principal principal) {
        String adminEmail = principal != null ? principal.getName() : "ADMIN";
        AuthResponse response = authService.provisionAdminUser(request, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session token is expired or invalid.");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = authService.getUserByEmail(email);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User record not found in session store.");
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole(),
                "createdAt", user.getCreatedAt().toString()
        ));
    }
}
