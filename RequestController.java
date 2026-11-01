package com.crisissync.controller;

import com.crisissync.service.DisasterManagementService;
import model.ReliefRequest;
import model.RescueRequest;
import model.SupplyRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "http://localhost", "http://127.0.0.1"}, allowedHeaders = "*", allowCredentials = "true")
public class RequestController {

    private final DisasterManagementService disasterService;

    public RequestController(DisasterManagementService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    public ResponseEntity<List<ReliefRequest>> getRequests() {
        return ResponseEntity.ok(disasterService.getRequests());
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ReliefRequest> getRequestById(@PathVariable("requestId") int requestId) {
        ReliefRequest req = disasterService.getRequests().stream()
                .filter(r -> r.getRequestId() == requestId)
                .findFirst()
                .orElse(null);
        if (req == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(req);
    }

    @PostMapping
    public ResponseEntity<? extends ReliefRequest> createGenericRequest(@RequestBody Map<String, Object> body) {
        String type = body.getOrDefault("requestType", "SUPPLY").toString().toUpperCase();
        if ("RESCUE".equals(type)) {
            return createRescueRequest(body);
        } else {
            return createSupplyRequest(body);
        }
    }

    @PostMapping("/supply")
    public ResponseEntity<SupplyRequest> createSupplyRequest(@RequestBody Map<String, Object> body) {
        int regionId = 1;
        if (body.containsKey("regionId")) {
            regionId = Integer.parseInt(body.get("regionId").toString());
        } else if (body.containsKey("regionName")) {
            String rName = body.get("regionName").toString();
            var reg = disasterService.findRegionByName(rName);
            if (reg != null) {
                regionId = reg.getRegionId();
            } else if (!disasterService.getRegions(false).isEmpty()) {
                regionId = disasterService.getRegions(false).get(0).getRegionId();
            }
        }
        int food = body.containsKey("foodRequired") 
                ? Integer.parseInt(body.get("foodRequired").toString()) 
                : Integer.parseInt(body.getOrDefault("requiredFood", 50).toString());
        int med = body.containsKey("medicineRequired") 
                ? Integer.parseInt(body.get("medicineRequired").toString()) 
                : Integer.parseInt(body.getOrDefault("requiredMedicine", 30).toString());

        SupplyRequest req = disasterService.createSupplyRequest(regionId, food, med);
        return ResponseEntity.status(HttpStatus.CREATED).body(req);
    }

    @PostMapping("/rescue")
    public ResponseEntity<RescueRequest> createRescueRequest(@RequestBody Map<String, Object> body) {
        int regionId = 1;
        if (body.containsKey("regionId")) {
            regionId = Integer.parseInt(body.get("regionId").toString());
        } else if (body.containsKey("regionName")) {
            String rName = body.get("regionName").toString();
            var reg = disasterService.findRegionByName(rName);
            if (reg != null) {
                regionId = reg.getRegionId();
            } else if (!disasterService.getRegions(false).isEmpty()) {
                regionId = disasterService.getRegions(false).get(0).getRegionId();
            }
        }
        int people = body.containsKey("peopleToRescue") 
                ? Integer.parseInt(body.get("peopleToRescue").toString()) 
                : Integer.parseInt(body.getOrDefault("affectedPopulation", 100).toString());
        int teams = body.containsKey("teamsRequired") 
                ? Integer.parseInt(body.get("teamsRequired").toString()) 
                : Integer.parseInt(body.getOrDefault("requiredTeams", 1).toString());

        RescueRequest req = disasterService.createRescueRequest(regionId, people, teams);
        return ResponseEntity.status(HttpStatus.CREATED).body(req);
    }

    @PostMapping("/process-next")
    public ResponseEntity<Map<String, Object>> processNextRequest() {
        Map<String, Object> result = disasterService.processNextRequest();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> deleteRequest(@PathVariable("requestId") int requestId) {
        boolean deleted = disasterService.deleteRequest(requestId);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Request #" + requestId + " deleted successfully."));
    }

    @RequestMapping(value = {"/{requestId}/requirements", "/{requestId}/archive-requirement"}, method = {RequestMethod.DELETE, RequestMethod.POST})
    public ResponseEntity<?> archiveCompletedRequirement(
            @PathVariable("requestId") int requestId,
            @RequestParam("resource") String resource) {
        try {
            boolean archived = disasterService.archiveCompletedRequirement(requestId, resource);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "requestId", requestId,
                    "resource", resource,
                    "message", "Completed requirement for " + resource + " successfully archived."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
