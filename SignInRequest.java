package com.crisissync.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SignInRequest {

    @NotBlank(message = "Email address or Admin ID is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String accountType; // ADMIN, COORDINATOR, PUBLIC

    public SignInRequest() {}

    public SignInRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public SignInRequest(String email, String password, String accountType) {
        this.email = email;
        this.password = password;
        this.accountType = accountType;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getRole() {
        return accountType;
    }

    public void setRole(String role) {
        if (this.accountType == null || this.accountType.trim().isEmpty()) {
            this.accountType = role;
        }
    }
}
