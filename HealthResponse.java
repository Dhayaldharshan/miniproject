package com.crisissync.dto;

import java.time.LocalDateTime;

public class HealthResponse {

    private String status;
    private String service;
    private LocalDateTime timestamp;
    private String engine;
    private boolean authReady;

    public HealthResponse() {}

    public HealthResponse(String status, String service, String engine, boolean authReady) {
        this.status = status;
        this.service = service;
        this.timestamp = LocalDateTime.now();
        this.engine = engine;
        this.authReady = authReady;
    }

    public String getStatus() {
        return status;
    }

    public String getService() {
        return service;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getEngine() {
        return engine;
    }

    public boolean isAuthReady() {
        return authReady;
    }
}
