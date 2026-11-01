package com.crisissync.dto;

public class AuthResponse {

    private String token;
    private String email;
    private String fullName;
    private String role;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String fullName, String role, String message) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getRole() {
        return role;
    }

    public String getMessage() {
        return message;
    }
}
