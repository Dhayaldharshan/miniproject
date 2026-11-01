package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import model.RescueTeam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/rescue-teams", "/api/teams"})
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class RescueTeamController {

    private final DisasterManagementService disasterService;

    public RescueTeamController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    public ResponseEntity<List<RescueTeam>> getRescueTeams() {
        return ResponseEntity.ok(disasterService.getRescueTeams());
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<RescueTeam> getRescueTeamById(@PathVariable("teamId") int teamId) {
        RescueTeam team = disasterService.getRescueTeams().stream()
                .filter(t -> t.getTeamId() == teamId)
                .findFirst()
                .orElse(null);
        if (team == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(team);
    }

    @PostMapping
    public ResponseEntity<RescueTeam> addRescueTeam(@RequestBody Map<String, Object> body) {
        int id = 0;
        if (body.get("teamId") != null) {
            id = Integer.parseInt(body.get("teamId").toString());
        } else if (body.get("id") != null) {
            id = Integer.parseInt(body.get("id").toString());
        }
        String name = body.get("teamName") != null ? body.get("teamName").toString() : "";
        String loc = body.get("currentLocation") != null ? body.get("currentLocation").toString() : "";

        RescueTeam team = new RescueTeam(id, name, loc);
        RescueTeam saved = disasterService.addRescueTeam(team);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @RequestMapping(value = {"/{teamId}/status", "/{teamId}/availability"}, method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<Map<String, Object>> updateTeamStatus(
            @PathVariable("teamId") int teamId,
            @RequestParam(value = "available", required = false) Boolean availableParam,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean available = true;
        if (availableParam != null) {
            available = availableParam;
        } else if (body != null && body.containsKey("available")) {
            available = Boolean.parseBoolean(body.get("available").toString());
        }
        boolean updated = disasterService.updateTeamStatus(teamId, available);

        if (!updated) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
                "teamId", teamId,
                "available", available,
                "message", "Team #" + teamId + " availability updated successfully."
        ));
    }

    @PostMapping("/{teamId}/assign")
    public ResponseEntity<Map<String, Object>> assignTeam(@PathVariable("teamId") int teamId, @RequestBody Map<String, Object> body) {
        int regionId = Integer.parseInt(body.get("regionId").toString());
        Map<String, Object> result = disasterService.assignTeamToRegion(teamId, regionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{teamId}/release")
    public ResponseEntity<Map<String, Object>> releaseTeam(@PathVariable("teamId") int teamId) {
        Map<String, Object> result = disasterService.releaseTeam(teamId);
        return ResponseEntity.ok(result);
    }

    @PostMapping({"/{requestId}/complete-mission", "/complete-mission/{requestId}"})
    public ResponseEntity<Map<String, Object>> completeMission(@PathVariable("requestId") int requestId) {
        disasterService.completeRescueMission(requestId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "requestId", requestId,
                "message", "Rescue mission #" + requestId + " completed successfully! Assigned teams are now available."
        ));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> deleteRescueTeam(@PathVariable("teamId") int teamId) {
        boolean deleted = disasterService.deleteRescueTeam(teamId);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Rescue Team #" + teamId + " deleted successfully."));
    }
}
