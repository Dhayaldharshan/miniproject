const fs = require('fs');
const path = require('path');

const dmsPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'service', 'DisasterManagementService.java');
let content = fs.readFileSync(dmsPath, 'utf8');

const target = `    public synchronized boolean deleteRequest(int requestId) {
        boolean removedHistory = requestHistory.removeIf(r -> r.getRequestId() == requestId);
        boolean removedQueue = requestManager.removeRequest(requestId);
        if (removedHistory || removedQueue) {
            requestRepo.deleteById(requestId);
            return true;
        }
        return false;
    }
}`;

const newMethods = `    public synchronized boolean deleteRequest(int requestId) {
        boolean removedHistory = requestHistory.removeIf(r -> r.getRequestId() == requestId);
        boolean removedQueue = requestManager.removeRequest(requestId);
        if (removedHistory || removedQueue) {
            requestRepo.deleteById(requestId);
            return true;
        }
        return false;
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

if (!content.includes('allocateResourcesDirectly')) {
    // Normalise newlines for exact search
    content = content.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = newMethods.replace(/\r\n/g, '\n');

    if (!content.includes(normTarget)) {
        console.error('Target not found in DMS!');
        process.exit(1);
    }
    content = content.replace(normTarget, normReplacement);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(dmsPath, content, 'utf8');
    console.log('Successfully appended coordinator methods to DisasterManagementService.java');
} else {
    console.log('allocateResourcesDirectly already in DisasterManagementService.java');
}

