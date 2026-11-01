package com.crisissync.controller;

import com.crisissync.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        boolean dbConnected = false;
        String engineInfo = "MySQL/MariaDB Persistent Database Engine (resq_allocate)";

        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                dbConnected = conn.isValid(2);
                if (dbConnected) {
                    engineInfo = "MySQL/MariaDB Persistent Database Engine (" + conn.getCatalog() + ")";
                }
            } catch (Exception e) {
                dbConnected = false;
                engineInfo = "Database Disconnected: " + e.getMessage();
            }
        }

        HealthResponse response = new HealthResponse(
                dbConnected ? "UP" : "DEGRADED",
                "ResQ-Allocate - Emergency Command & Control Center",
                engineInfo,
                true
        );
        return ResponseEntity.ok(response);
    }
}
