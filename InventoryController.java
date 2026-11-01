package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class InventoryController {

    private final DisasterManagementService disasterService;

    public InventoryController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getInventory() {
        return ResponseEntity.ok(disasterService.getInventory());
    }

    @PostMapping({"", "/add"})
    public ResponseEntity<Map<String, Integer>> updateInventory(@RequestBody Map<String, Object> body) {
        int food = 0;
        if (body.containsKey("foodQuantity")) {
            food = Integer.parseInt(body.get("foodQuantity").toString());
        } else if (body.containsKey("foodKits")) {
            food = Integer.parseInt(body.get("foodKits").toString());
        }

        int med = 0;
        if (body.containsKey("medicineQuantity")) {
            med = Integer.parseInt(body.get("medicineQuantity").toString());
        } else if (body.containsKey("medicineKits")) {
            med = Integer.parseInt(body.get("medicineKits").toString());
        }

        Map<String, Integer> updated = disasterService.updateInventory(food, med);
        return ResponseEntity.ok(updated);
    }
}
