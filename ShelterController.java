package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import model.Shelter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shelters")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class ShelterController {

    private final DisasterManagementService disasterService;

    public ShelterController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    public ResponseEntity<List<Shelter>> getShelters() {
        return ResponseEntity.ok(disasterService.getShelters());
    }

    @GetMapping("/{shelterId}")
    public ResponseEntity<Shelter> getShelterById(@PathVariable("shelterId") int shelterId) {
        Shelter shelter = disasterService.getShelters().stream()
                .filter(s -> s.getShelterId() == shelterId)
                .findFirst()
                .orElse(null);
        if (shelter == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(shelter);
    }

    @PostMapping
    public ResponseEntity<Shelter> addShelter(@RequestBody Map<String, Object> body) {
        int id = 0;
        if (body.get("shelterId") != null) {
            id = Integer.parseInt(body.get("shelterId").toString());
        } else if (body.get("id") != null) {
            id = Integer.parseInt(body.get("id").toString());
        }
        String name = body.get("shelterName") != null ? body.get("shelterName").toString() : "";
        String loc = body.get("location") != null ? body.get("location").toString() : "";
        int cap = body.get("capacity") != null ? Integer.parseInt(body.get("capacity").toString()) : 100;

        Shelter shelter = new Shelter(id, name, loc, cap);
        Shelter saved = disasterService.addShelter(shelter);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/allocate")
    public ResponseEntity<?> allocateShelter(@RequestBody Map<String, Object> body) {
        int people = Integer.parseInt(body.get("people").toString());
        Shelter allocated = disasterService.allocateShelter(people);
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Allocated " + people + " evacuees to shelter " + allocated.getShelterName());
        response.put("shelterId", allocated.getShelterId());
        response.put("shelterName", allocated.getShelterName());
        response.put("location", allocated.getLocation());
        response.put("capacity", allocated.getCapacity());
        response.put("occupied", allocated.getOccupied());
        response.put("shelter", allocated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{shelterId}")
    public ResponseEntity<?> deleteShelter(@PathVariable("shelterId") int shelterId) {
        boolean deleted = disasterService.deleteShelter(shelterId);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Shelter #" + shelterId + " deleted successfully."));
    }
}
