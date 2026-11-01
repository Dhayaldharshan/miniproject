package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/allocation")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class AllocationController {

    private final DisasterManagementService disasterService;

    public AllocationController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @PostMapping("/allocate")
    public ResponseEntity<Map<String, Object>> allocateResources(@RequestBody Map<String, Object> body) {
        int regionId = Integer.parseInt(body.get("regionId").toString());
        int foodKits = body.get("foodKits") != null ? Integer.parseInt(body.get("foodKits").toString()) : 0;
        int medicalKits = body.get("medicalKits") != null ? Integer.parseInt(body.get("medicalKits").toString()) : 0;
        Map<String, Object> result = disasterService.allocateResourcesDirectly(regionId, foodKits, medicalKits);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/process-next")
    public ResponseEntity<Map<String, Object>> processNext() {
        return ResponseEntity.ok(disasterService.processNextRequest());
    }

    @PostMapping("/complete-mission/{requestId}")
    public ResponseEntity<Map<String, Object>> completeMission(@PathVariable("requestId") int requestId) {
        disasterService.completeRescueMission(requestId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "requestId", requestId,
                "message", "Mission #" + requestId + " completed successfully! Assigned rescue teams released."
        ));
    }
}
