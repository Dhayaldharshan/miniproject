package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class DashboardController {

    private final DisasterManagementService disasterService;

    public DashboardController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(disasterService.getDashboardStats());
    }
}
