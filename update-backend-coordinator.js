const fs = require('fs');
const path = require('path');

// 1. Update src/model/AffectedRegion.java
const affectedRegionPath = path.join(__dirname, '..', 'src', 'model', 'AffectedRegion.java');
let arContent = fs.readFileSync(affectedRegionPath, 'utf8');

if (!arContent.includes('disasterType')) {
    const target = `    private boolean accessible;

    private boolean networkReachable = true;`;
    const replacement = `    private boolean accessible;
    private String disasterType = "General Emergency";
    private String description = "";

    private boolean networkReachable = true;`;
    arContent = arContent.replace(target, replacement);

    const constructorTarget = `        this.accessible = accessible;
        this.networkReachable = true;
        this.hasRoadMapping = false;
    }`;
    const constructorReplacement = `        this.accessible = accessible;
        this.disasterType = "General Emergency";
        this.description = "";
        this.networkReachable = true;
        this.hasRoadMapping = false;
    }

    public AffectedRegion(int regionId, String regionName,
                           int population, int severity,
                           boolean accessible, String disasterType,
                           String description) {

        this.regionId = regionId;
        this.regionName = regionName;
        this.population = population;
        this.severity = severity;
        this.accessible = accessible;
        this.disasterType = (disasterType != null && !disasterType.trim().isEmpty()) ? disasterType.trim() : "General Emergency";
        this.description = (description != null) ? description.trim() : "";
        this.networkReachable = true;
        this.hasRoadMapping = false;
    }`;
    arContent = arContent.replace(constructorTarget, constructorReplacement);

    const gettersTarget = `    public void setAccessible(boolean accessible) {
        this.accessible = accessible;
    }`;
    const gettersReplacement = `    public void setAccessible(boolean accessible) {
        this.accessible = accessible;
    }

    public String getDisasterType() {
        return disasterType;
    }

    public void setDisasterType(String disasterType) {
        this.disasterType = (disasterType != null && !disasterType.trim().isEmpty()) ? disasterType.trim() : "General Emergency";
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = (description != null) ? description.trim() : "";
    }`;
    arContent = arContent.replace(gettersTarget, gettersReplacement);

    arContent = arContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(affectedRegionPath, arContent, 'utf8');
    console.log('Updated src/model/AffectedRegion.java');
} else {
    console.log('src/model/AffectedRegion.java already has disasterType');
}

// 2. Update RegionController.java to pass disasterType & description to AffectedRegion
const regCtrlPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'controller', 'RegionController.java');
let regCtrlContent = fs.readFileSync(regCtrlPath, 'utf8');
if (!regCtrlContent.includes('region.setDisasterType(disasterType)')) {
    const regTarget = `        // 1. Add region using existing mechanism (auto-generates Region ID)
        AffectedRegion region = new AffectedRegion(0, name, pop, sev, acc);
        AffectedRegion saved = disasterService.addRegion(region);`;
    const regReplacement = `        // 1. Add region using existing mechanism (auto-generates Region ID)
        AffectedRegion region = new AffectedRegion(0, name, pop, sev, acc, disasterType, description);
        AffectedRegion saved = disasterService.addRegion(region);`;
    regCtrlContent = regCtrlContent.replace(regTarget, regReplacement);
    regCtrlContent = regCtrlContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(regCtrlPath, regCtrlContent, 'utf8');
    console.log('Updated RegionController.java');
}

// 3. Update DisasterManagementService.java for region mapping and operational methods
const dmsPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'service', 'DisasterManagementService.java');
let dmsContent = fs.readFileSync(dmsPath, 'utf8');

if (!dmsContent.includes('allocateResourcesDirectly')) {
    // A) In startup loading regions from DB:
    const loadTarget = `        for (AffectedRegionEntity re : regionRepo.findAll()) {
            regions.add(new AffectedRegion(
                    re.getRegionId(),
                    re.getRegionName(),
                    re.getPopulation(),
                    re.getSeverity(),
                    re.isAccessible()
            ));
        }`;
    const loadReplacement = `        for (AffectedRegionEntity re : regionRepo.findAll()) {
            regions.add(new AffectedRegion(
                    re.getRegionId(),
                    re.getRegionName(),
                    re.getPopulation(),
                    re.getSeverity(),
                    re.isAccessible(),
                    re.getDisasterType(),
                    re.getDescription()
            ));
        }`;
    dmsContent = dmsContent.replace(loadTarget, loadReplacement);

    // B) In addRegion persisting to DB:
    const saveTarget = `        // Persist to MariaDB
        regionRepo.save(new AffectedRegionEntity(
                region.getRegionId(),
                region.getRegionName().trim(),
                region.getPopulation(),
                region.getSeverity(),
                region.isAccessible()
        ));`;
    const saveReplacement = `        // Persist to MariaDB
        regionRepo.save(new AffectedRegionEntity(
                region.getRegionId(),
                region.getRegionName().trim(),
                region.getPopulation(),
                region.getSeverity(),
                region.isAccessible(),
                region.getDisasterType(),
                region.getDescription()
        ));`;
    dmsContent = dmsContent.replace(saveTarget, saveReplacement);

    // C) Add Coordinator operational methods:
    const endClassTarget = `    public synchronized boolean deleteShelter(int shelterId) {
        boolean removed = resourceManager.getShelters().removeIf(s -> s.getShelterId() == shelterId);
        if (removed) {
            shelterRepo.deleteById(shelterId);
        }
        return removed;
    }
}`;
    const newMethods = `    public synchronized boolean deleteShelter(int shelterId) {
        boolean removed = resourceManager.getShelters().removeIf(s -> s.getShelterId() == shelterId);
        if (removed) {
            shelterRepo.deleteById(shelterId);
        }
        return removed;
    }

    // =========================================================================
    // COORDINATOR DIRECT OPERATIONAL METHODS
    // =========================================================================

    public synchronized Map<String, Object> allocateResourcesDirectly(int regionId, int foodKits, int medicalKits) {
        if (foodKits < 0 || medicalKits < 0 || (foodKits == 0 && medicalKits == 0)) {
            throw new IllegalArgumentException("Allocation quantity must be greater than zero.");
        }
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            throw new IllegalArgumentException("Region #" + regionId + " not found.");
        }

        ResourceStock stock = resourceManager.getStock();
        int availableFood = stock != null ? stock.getFoodKits() : 0;
        int availableMed = stock != null ? stock.getMedicineKits() : 0;

        if (foodKits > availableFood) {
            throw new IllegalStateException("Cannot allocate " + foodKits + " food kits. Warehouse stock is only " + availableFood + ".");
        }
        if (medicalKits > availableMed) {
            throw new IllegalStateException("Cannot allocate " + medicalKits + " medical kits. Warehouse stock is only " + availableMed + ".");
        }

        // Find active supply request for this region
        SupplyRequest supplyReq = requestHistory.stream()
                .filter(r -> r instanceof SupplyRequest)
                .map(r -> (SupplyRequest) r)
                .filter(r -> r.getRegion().getRegionId() == regionId && !"COMPLETED".equalsIgnoreCase(r.getStatus()))
                .findFirst()
                .orElse(null);

        if (supplyReq == null) {
            supplyReq = createSupplyRequest(regionId, foodKits, medicalKits);
        }

        int foodNeeded = Math.max(0, supplyReq.getFoodRequired() - supplyReq.getFoodAllocated());
        int medNeeded = Math.max(0, supplyReq.getMedicineRequired() - supplyReq.getMedicineAllocated());

        if (foodKits > foodNeeded && foodNeeded > 0) {
            foodKits = foodNeeded;
        }
        if (medicalKits > medNeeded && medNeeded > 0) {
            medicalKits = medNeeded;
        }

        // Deduct from stock
        if (foodKits > 0) stock.deductFood(foodKits);
        if (medicalKits > 0) stock.deductMedicine(medicalKits);
        stockRepo.findById(1).ifPresent(se -> {
            se.setFoodKits(stock.getFoodKits());
            se.setMedicineKits(stock.getMedicineKits());
            stockRepo.save(se);
        });

        // Update supply request in-memory
        supplyReq.allocateFood(foodKits);
        supplyReq.allocateMedicine(medicalKits);
        boolean complete = supplyReq.getFoodAllocated() >= supplyReq.getFoodRequired() &&
                           supplyReq.getMedicineAllocated() >= supplyReq.getMedicineRequired();
        supplyReq.setStatus(complete ? "COMPLETED" : "PARTIALLY_FULFILLED");

        // Persist in MariaDB relief_requests
        final int finalFoodKits = foodKits;
        final int finalMedKits = medicalKits;
        requestRepo.findById(supplyReq.getRequestId()).ifPresent(re -> {
            re.setFoodAllocated(re.getFoodAllocated() != null ? re.getFoodAllocated() + finalFoodKits : finalFoodKits);
            re.setMedicineAllocated(re.getMedicineAllocated() != null ? re.getMedicineAllocated() + finalMedKits : finalMedKits);
            re.setStatus(complete ? "COMPLETED" : "PARTIALLY_FULFILLED");
            requestRepo.save(re);
        });

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("regionId", regionId);
        res.put("regionName", region.getRegionName());
        res.put("foodAllocated", foodKits);
        res.put("medicineAllocated", medicalKits);
        res.put("totalFoodAllocated", supplyReq.getFoodAllocated());
        res.put("totalMedicineAllocated", supplyReq.getMedicineAllocated());
        res.put("remainingFoodNeed", Math.max(0, supplyReq.getFoodRequired() - supplyReq.getFoodAllocated()));
        res.put("remainingMedicineNeed", Math.max(0, supplyReq.getMedicineRequired() - supplyReq.getMedicineAllocated()));
        res.put("availableFoodStock", stock.getFoodKits());
        res.put("availableMedicineStock", stock.getMedicineKits());
        res.put("requestStatus", supplyReq.getStatus());
        res.put("message", "Allocated " + foodKits + " Food Kits and " + medicalKits + " Medical Kits to " + region.getRegionName() + ".");
        return res;
    }

    public synchronized Map<String, Object> assignTeamToRegion(int teamId, int regionId) {
        RescueTeam team = resourceManager.findTeamById(teamId);
        if (team == null) {
            throw new IllegalArgumentException("Rescue Team #" + teamId + " not found.");
        }
        if (!team.isAvailable()) {
            throw new IllegalStateException("Rescue Team #" + teamId + " (" + team.getTeamName() + ") is already BUSY on an active deployment. Only AVAILABLE teams can be deployed.");
        }
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            throw new IllegalArgumentException("Region #" + regionId + " not found.");
        }

        team.setAvailable(false);
        team.setCurrentLocation(region.getRegionName());

        // Update in MariaDB rescue_teams
        teamRepo.findById(teamId).ifPresent(te -> {
            te.setAvailable(false);
            te.setCurrentLocation(region.getRegionName());
            teamRepo.save(te);
        });

        // Link to active rescue request if waiting
        RescueRequest rescueReq = requestHistory.stream()
                .filter(r -> r instanceof RescueRequest)
                .map(r -> (RescueRequest) r)
                .filter(r -> r.getRegion().getRegionId() == regionId && "WAITING".equalsIgnoreCase(r.getStatus()))
                .findFirst()
                .orElse(null);

        if (rescueReq != null) {
            rescueReq.setStatus("IN_PROGRESS");
            rescueReq.addAssignedTeam(team);
            requestRepo.findById(rescueReq.getRequestId()).ifPresent(re -> {
                re.setStatus("IN_PROGRESS");
                re.setAssignedTeamId(teamId);
                requestRepo.save(re);
            });
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("teamId", teamId);
        res.put("teamName", team.getTeamName());
        res.put("regionId", regionId);
        res.put("regionName", region.getRegionName());
        res.put("available", false);
        res.put("message", "Rescue Team #" + teamId + " (" + team.getTeamName() + ") successfully assigned to " + region.getRegionName() + ".");
        return res;
    }

    public synchronized Map<String, Object> releaseTeam(int teamId) {
        RescueTeam team = resourceManager.findTeamById(teamId);
        if (team == null) {
            throw new IllegalArgumentException("Rescue Team #" + teamId + " not found.");
        }
        team.setAvailable(true);
        teamRepo.findById(teamId).ifPresent(te -> {
            te.setAvailable(true);
            teamRepo.save(te);
        });
        return Map.of("success", true, "teamId", teamId, "available", true, "message", "Rescue Team #" + teamId + " released back to AVAILABLE status.");
    }
}`;
    dmsContent = dmsContent.replace(endClassTarget, newMethods);
    dmsContent = dmsContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(dmsPath, dmsContent, 'utf8');
    console.log('Updated DisasterManagementService.java');
}

// 4. Update AllocationController.java
const allocCtrlPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'controller', 'AllocationController.java');
let allocContent = fs.readFileSync(allocCtrlPath, 'utf8');
if (!allocContent.includes('/allocate')) {
    const allocTarget = `    @PostMapping("/process-next")`;
    const allocReplacement = `    @PostMapping("/allocate")
    public ResponseEntity<Map<String, Object>> allocateResources(@RequestBody Map<String, Object> body) {
        int regionId = Integer.parseInt(body.get("regionId").toString());
        int foodKits = body.get("foodKits") != null ? Integer.parseInt(body.get("foodKits").toString()) : 0;
        int medicalKits = body.get("medicalKits") != null ? Integer.parseInt(body.get("medicalKits").toString()) : 0;
        Map<String, Object> result = disasterService.allocateResourcesDirectly(regionId, foodKits, medicalKits);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/process-next")`;
    allocContent = allocContent.replace(allocTarget, allocReplacement);
    allocContent = allocContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(allocCtrlPath, allocContent, 'utf8');
    console.log('Updated AllocationController.java');
}

// 5. Update RescueTeamController.java
const teamCtrlPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'controller', 'RescueTeamController.java');
let teamCtrlContent = fs.readFileSync(teamCtrlPath, 'utf8');
if (!teamCtrlContent.includes('/assign')) {
    const teamTarget = `    @PostMapping({"/{requestId}/complete-mission", "/complete-mission/{requestId}"})`;
    const teamReplacement = `    @PostMapping("/{teamId}/assign")
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

    @PostMapping({"/{requestId}/complete-mission", "/complete-mission/{requestId}"})`;
    teamCtrlContent = teamCtrlContent.replace(teamTarget, teamReplacement);
    teamCtrlContent = teamCtrlContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(teamCtrlPath, teamCtrlContent, 'utf8');
    console.log('Updated RescueTeamController.java');
}

// 6. Update SecurityConfig.java
const secPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'config', 'SecurityConfig.java');
let secContent = fs.readFileSync(secPath, 'utf8');
if (!secContent.includes('/api/allocation/**')) {
    const secTarget = `"/api/rescue-teams/**", "/api/shelters/**", "/api/roads/**", "/api/requests/**")`;
    const secReplacement = `"/api/rescue-teams/**", "/api/shelters/**", "/api/roads/**", "/api/requests/**", "/api/allocation/**")`;
    secContent = secContent.replace(secTarget, secReplacement);
    secContent = secContent.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(secPath, secContent, 'utf8');
    console.log('Updated SecurityConfig.java');
}

console.log('Backend Coordinator updates completed successfully!');

