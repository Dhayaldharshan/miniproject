package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import graph.Road;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class RoadController {

    private final DisasterManagementService disasterService;

    public RoadController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping({"/api/roads", "/api/roads/network"})
    public ResponseEntity<List<Road>> getRoadNetwork() {
        return ResponseEntity.ok(disasterService.getRoadNetwork());
    }

    @PostMapping("/api/roads")
    public ResponseEntity<Road> addRoad(@RequestBody Map<String, Object> body) {
        String source = body.get("source").toString().trim();
        String destination = body.get("destination").toString().trim();
        int time = Integer.parseInt(body.get("travelTime").toString());

        Road road = disasterService.addRoad(source, destination, time);
        return ResponseEntity.status(HttpStatus.CREATED).body(road);
    }

    @RequestMapping(value = "/api/roads/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<Map<String, Object>> updateRoadStatus(@RequestBody Map<String, Object> body) {
        String source = body.get("source").toString().trim();
        String destination = body.get("destination").toString().trim();
        boolean open = Boolean.parseBoolean(body.get("open").toString());

        boolean updated = disasterService.updateRoadStatus(source, destination, open);
        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Road connection between " + source + " and " + destination + " not found."
            ));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "source", source,
                "destination", destination,
                "open", open,
                "message", "Road status between " + source + " and " + destination + " updated to " + (open ? "OPEN" : "CLOSED")
        ));
    }

    @GetMapping({"/api/routes/shortest-time", "/api/roads/shortest-path", "/api/roads/shortest-time"})
    public ResponseEntity<Map<String, Object>> getShortestRoute(
            @RequestParam("source") String source,
            @RequestParam("destination") String destination) {
        Map<String, Object> result = disasterService.getShortestRoute(source, destination);
        return ResponseEntity.ok(result);
    }

    @GetMapping({"/api/routes/candidate-routes", "/api/roads/candidate-routes", "/api/roads/candidates"})
    public ResponseEntity<List<Map<String, Object>>> getCandidateRoutes(
            @RequestParam("source") String source,
            @RequestParam("destination") String destination) {
        List<Map<String, Object>> candidateRoutes = disasterService.getCandidateRoutes(source, destination);
        return ResponseEntity.ok(candidateRoutes);
    }

    @GetMapping({"/api/roads/reachability", "/api/routes/reachability"})
    public ResponseEntity<Map<String, Object>> getReachability(
            @RequestParam(value = "depot", defaultValue = "Aruvi Village") String depot) {
        return ResponseEntity.ok(disasterService.getRoadReachabilityReport(depot));
    }

    @DeleteMapping("/api/roads")
    public ResponseEntity<?> deleteRoad(
            @RequestParam("source") String source,
            @RequestParam("destination") String destination) {
        boolean deleted = disasterService.deleteRoad(source, destination);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Road connection between " + source + " and " + destination + " not found."
            ));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Road connection between " + source + " and " + destination + " deleted successfully."
        ));
    }
}
