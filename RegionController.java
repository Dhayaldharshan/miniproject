package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import model.AffectedRegion;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/regions")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class RegionController {

    private final DisasterManagementService disasterService;

    public RegionController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    public ResponseEntity<List<AffectedRegion>> getRegions(
            @RequestParam(value = "prioritySorted", defaultValue = "false") boolean prioritySorted) {
        return ResponseEntity.ok(disasterService.getRegions(prioritySorted));
    }

    @GetMapping("/priority")
    public ResponseEntity<List<AffectedRegion>> getPriorityRegions() {
        return ResponseEntity.ok(disasterService.getRegions(true));
    }

    @GetMapping("/highest-need")
    public ResponseEntity<?> getHighestNeedRegion() {
        AffectedRegion region = disasterService.getHighestNeedRegion();
        if (region == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(region);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AffectedRegion> getRegionById(@PathVariable("id") int id) {
        AffectedRegion region = disasterService.findRegionById(id);
        if (region == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(region);
    }

    @PostMapping
    public ResponseEntity<AffectedRegion> addRegion(@RequestBody Map<String, Object> body) {
        int id = 0;
        if (body.get("regionId") != null && !body.get("regionId").toString().trim().isEmpty()) {
            try {
                id = Integer.parseInt(body.get("regionId").toString().trim());
            } catch (NumberFormatException ignored) {
                id = 0;
            }
        } else if (body.get("id") != null && !body.get("id").toString().trim().isEmpty()) {
            try {
                id = Integer.parseInt(body.get("id").toString().trim());
            } catch (NumberFormatException ignored) {
                id = 0;
            }
        }
        String name = body.get("regionName") != null ? body.get("regionName").toString().trim() : "";
        int pop = 0;
        if (body.get("population") != null && !body.get("population").toString().trim().isEmpty()) {
            try {
                pop = Math.max(0, Integer.parseInt(body.get("population").toString().trim()));
            } catch (NumberFormatException ignored) {
                pop = 0;
            }
        }
        int sev = 1;
        if (body.get("severity") != null && !body.get("severity").toString().trim().isEmpty()) {
            try {
                sev = Math.min(5, Math.max(1, Integer.parseInt(body.get("severity").toString().trim())));
            } catch (NumberFormatException ignored) {
                sev = 1;
            }
        }
        boolean acc = true;
        if (body.get("accessible") != null && !body.get("accessible").toString().trim().isEmpty()) {
            acc = Boolean.parseBoolean(body.get("accessible").toString().trim());
        }

        String disasterType = body.getOrDefault("disasterType", "General Emergency").toString().trim();
        String description = body.getOrDefault("description", "").toString().trim();
        AffectedRegion region = new AffectedRegion(id, name, pop, sev, acc, disasterType, description);
        AffectedRegion saved = disasterService.addRegion(region);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping(value = {"/report", "/public-report"})
    public ResponseEntity<Map<String, Object>> submitPublicReport(@RequestBody Map<String, Object> body) {
        String name = body.get("regionName") != null ? body.get("regionName").toString().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Affected region / place name is required.");
        }

        int pop = 0;
        if (body.get("population") != null && !body.get("population").toString().trim().isEmpty()) {
            try {
                pop = Math.max(0, Integer.parseInt(body.get("population").toString().trim()));
            } catch (NumberFormatException ignored) {
                pop = 0;
            }
        }

        int sev = 3; // Default moderate
        if (body.get("severity") != null && !body.get("severity").toString().trim().isEmpty()) {
            try {
                sev = Math.min(5, Math.max(1, Integer.parseInt(body.get("severity").toString().trim())));
            } catch (NumberFormatException ignored) {
                sev = 3;
            }
        }

        boolean acc = true;
        if (body.get("accessible") != null && !body.get("accessible").toString().trim().isEmpty()) {
            acc = Boolean.parseBoolean(body.get("accessible").toString().trim());
        }

        String disasterType = body.getOrDefault("disasterType", "General Emergency").toString().trim();
        String description = body.getOrDefault("description", "").toString().trim();

        // 1. Add region using existing mechanism (auto-generates Region ID)
        AffectedRegion region = new AffectedRegion(0, name, pop, sev, acc, disasterType, description);
        AffectedRegion saved = disasterService.addRegion(region);

        // 2. Parse required assistance
        @SuppressWarnings("unchecked")
        List<String> assistance = body.get("requiredAssistance") instanceof List
                ? (List<String>) body.get("requiredAssistance")
                : List.of();

        boolean needsFood = assistance.stream().anyMatch(a -> a.equalsIgnoreCase("food") || a.toLowerCase().contains("food"));
        boolean needsMed = assistance.stream().anyMatch(a -> a.equalsIgnoreCase("medicine") || a.equalsIgnoreCase("medical") || a.toLowerCase().contains("med"));
        boolean needsTeams = assistance.stream().anyMatch(a -> a.equalsIgnoreCase("teams") || a.equalsIgnoreCase("rescue") || a.toLowerCase().contains("team"));
        boolean needsShelters = assistance.stream().anyMatch(a -> a.equalsIgnoreCase("shelters") || a.equalsIgnoreCase("shelter") || a.toLowerCase().contains("shelter"));

        // Parse user-specified quantities (with positive validation)
        int foodQuantity = parsePositiveInt(body.get("foodQuantity"), body.get("foodRequired"));
        int medicineQuantity = parsePositiveInt(body.get("medicineQuantity"), body.get("medicineRequired"));
        int rescueTeamsQuantity = parsePositiveInt(body.get("rescueTeamsQuantity"), body.get("teamsRequired"));
        int shelterPeopleQuantity = parsePositiveInt(body.get("shelterPeopleQuantity"), body.get("peopleToRescue"));

        Integer supplyReqId = null;
        Integer rescueReqId = null;

        // Create WAITING supply request if food or medicine needed (unallocated)
        if (needsFood || needsMed) {
            int foodQty = needsFood ? (foodQuantity > 0 ? foodQuantity : (pop > 0 ? (int) Math.ceil(pop * 0.5) : 50)) : 0;
            int medQty = needsMed ? (medicineQuantity > 0 ? medicineQuantity : (pop > 0 ? (int) Math.ceil(pop * 0.3) : 30)) : 0;
            var supplyReq = disasterService.createSupplyRequest(saved.getRegionId(), foodQty, medQty);
            supplyReqId = supplyReq.getRequestId();
        }

        // Create WAITING rescue request if rescue teams or shelters needed (unassigned)
        if (needsTeams || needsShelters) {
            int rescuePop = needsShelters ? (shelterPeopleQuantity > 0 ? shelterPeopleQuantity : (pop > 0 ? pop : 50)) : (pop > 0 ? pop : 50);
            int teamsNeeded = needsTeams ? (rescueTeamsQuantity > 0 ? rescueTeamsQuantity : 1) : 1;
            var rescueReq = disasterService.createRescueRequest(saved.getRegionId(), rescuePop, teamsNeeded);
            rescueReqId = rescueReq.getRequestId();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Emergency incident report registered successfully.");
        response.put("regionId", saved.getRegionId());
        response.put("regionName", saved.getRegionName());
        response.put("severity", saved.getSeverity());
        response.put("population", saved.getPopulation());
        response.put("accessible", saved.isAccessible());
        response.put("disasterType", disasterType);
        response.put("description", description);
        response.put("requiredAssistance", assistance);
        response.put("foodQuantity", foodQuantity);
        response.put("medicineQuantity", medicineQuantity);
        response.put("rescueTeamsQuantity", rescueTeamsQuantity);
        response.put("shelterPeopleQuantity", shelterPeopleQuantity);
        response.put("supplyRequestId", supplyReqId);
        response.put("rescueRequestId", rescueReqId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private int parsePositiveInt(Object primary, Object secondary) {
        if (primary != null && !primary.toString().trim().isEmpty()) {
            try {
                int val = Integer.parseInt(primary.toString().trim());
                if (val > 0) return val;
            } catch (NumberFormatException ignored) {}
        }
        if (secondary != null && !secondary.toString().trim().isEmpty()) {
            try {
                int val = Integer.parseInt(secondary.toString().trim());
                if (val > 0) return val;
            } catch (NumberFormatException ignored) {}
        }
        return 0;
    }

    @PutMapping("/{id}")
    public ResponseEntity<AffectedRegion> updateRegion(@PathVariable("id") int id, @RequestBody Map<String, Object> body) {
        int pop = Integer.parseInt(body.get("population").toString());
        int sev = Integer.parseInt(body.get("severity").toString());
        boolean acc = Boolean.parseBoolean(body.get("accessible").toString());

        AffectedRegion updated = disasterService.updateRegion(id, pop, sev, acc);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegion(@PathVariable("id") int id) {
        boolean deleted = disasterService.deleteRegion(id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Region #" + id + " deleted successfully."));
    }

    @GetMapping("/traverse/bfs")
    public ResponseEntity<Map<String, Object>> getBfsTraversal(@RequestParam("start") String start) {
        List<String> visited = disasterService.getBfsTraversal(start);
        Map<String, Object> response = new HashMap<>();
        response.put("start", start);
        response.put("visited", visited);
        response.put("traversalOrder", visited);
        response.put("count", visited.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/traverse/dfs")
    public ResponseEntity<Map<String, Object>> getDfsTraversal(@RequestParam("start") String start) {
        List<String> visited = disasterService.getDfsTraversal(start);
        Map<String, Object> response = new HashMap<>();
        response.put("start", start);
        response.put("visited", visited);
        response.put("traversalOrder", visited);
        response.put("count", visited.size());
        return ResponseEntity.ok(response);
    }
}
