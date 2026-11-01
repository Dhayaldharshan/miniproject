package com.crisissync.service;

import com.crisissync.entity.*;
import com.crisissync.repository.*;
import data.SampleData;
import graph.Graph;
import graph.Road;
import manager.RequestManager;
import manager.ResourceManager;
import model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class DisasterManagementService {

    private final AffectedRegionRepository regionRepo;
    private final RescueTeamRepository teamRepo;
    private final ShelterRepository shelterRepo;
    private final RoadRepository roadRepo;
    private final ResourceStockRepository stockRepo;
    private final ReliefRequestRepository requestRepo;

    private final List<AffectedRegion> regions = new CopyOnWriteArrayList<>();
    private final ResourceManager resourceManager = new ResourceManager();
    private final RequestManager requestManager = new RequestManager();
    private final List<ReliefRequest> requestHistory = new CopyOnWriteArrayList<>();
    private final Graph roadGraph = new Graph();

    private final AtomicInteger nextRequestId = new AtomicInteger(1001);
    private final AtomicInteger nextArrivalOrder = new AtomicInteger(1);

    public DisasterManagementService(AffectedRegionRepository regionRepo,
                                     RescueTeamRepository teamRepo,
                                     ShelterRepository shelterRepo,
                                     RoadRepository roadRepo,
                                     ResourceStockRepository stockRepo,
                                     ReliefRequestRepository requestRepo) {
        this.regionRepo = regionRepo;
        this.teamRepo = teamRepo;
        this.shelterRepo = shelterRepo;
        this.roadRepo = roadRepo;
        this.stockRepo = stockRepo;
        this.requestRepo = requestRepo;
    }

    @PostConstruct
    public void init() {
        initDatabaseData();
    }

    private synchronized void initDatabaseData() {
        // ==========================================
        // 1. REGIONS
        // ==========================================
        if (regionRepo.count() == 0) {
            for (AffectedRegion r : SampleData.createRegions()) {
                regionRepo.save(new AffectedRegionEntity(
                        r.getRegionId(),
                        r.getRegionName(),
                        r.getPopulation(),
                        r.getSeverity(),
                        r.isAccessible()
                ));
            }
        }
        regions.clear();
        for (AffectedRegionEntity re : regionRepo.findAll()) {
            regions.add(new AffectedRegion(
                    re.getRegionId(),
                    re.getRegionName(),
                    re.getPopulation(),
                    re.getSeverity(),
                    re.isAccessible(),
                    re.getDisasterType(),
                    re.getDescription()
            ));
        }

        // ==========================================
        // 2. RESCUE TEAMS
        // ==========================================
        if (teamRepo.count() == 0) {
            for (RescueTeam t : SampleData.createRescueTeams()) {
                teamRepo.save(new RescueTeamEntity(
                        t.getTeamId(),
                        t.getTeamName(),
                        t.getCurrentLocation(),
                        t.isAvailable()
                ));
            }
        }
        for (RescueTeamEntity te : teamRepo.findAll()) {
            RescueTeam team = new RescueTeam(te.getTeamId(), te.getTeamName(), te.getCurrentLocation());
            team.setAvailable(te.isAvailable());
            resourceManager.addRescueTeam(team);
        }

        // ==========================================
        // 3. SHELTERS
        // ==========================================
        if (shelterRepo.count() == 0) {
            for (Shelter s : SampleData.createShelters()) {
                shelterRepo.save(new ShelterEntity(
                        s.getShelterId(),
                        s.getShelterName(),
                        s.getLocation(),
                        s.getCapacity(),
                        s.getOccupied()
                ));
            }
        }
        for (ShelterEntity se : shelterRepo.findAll()) {
            Shelter shelter = new Shelter(se.getShelterId(), se.getShelterName(), se.getLocation(), se.getCapacity());
            if (se.getOccupied() > 0) {
                shelter.reserveSpace(se.getOccupied());
            }
            resourceManager.addShelter(shelter);
        }

        // ==========================================
        // 4. RESOURCE STOCK
        // ==========================================
        if (stockRepo.count() == 0) {
            stockRepo.save(new ResourceStockEntity(500, 300));
        }
        ResourceStockEntity stockEntity = stockRepo.findAll().get(0);
        resourceManager.addNewStock(stockEntity.getFoodKits(), stockEntity.getMedicineKits());

        // ==========================================
        // 5. ROAD NETWORK
        // ==========================================
        if (roadRepo.count() == 0) {
            String[][] defaultRoads = {
                    {"Aruvi Village", "Kurinji Nagar", "15"},
                    {"Kurinji Nagar", "Mullai Area", "20"},
                    {"Mullai Area", "Marutham Town", "25"},
                    {"Marutham Town", "Neithal Colony", "30"},
                    {"Neithal Colony", "Valley Road", "18"},
                    {"Valley Road", "River Side", "22"},
                    {"River Side", "Hill View", "12"},
                    {"Hill View", "Aruvi Village", "35"},
                    {"Aruvi Village", "Valley Road", "40"},
                    {"Marutham Town", "River Side", "15"},
                    {"Uptown", "Midtown", "10"},
                    {"Midtown", "Downtown", "12"},
                    {"Uptown", "Downtown", "25"}
            };
            for (String[] r : defaultRoads) {
                roadRepo.save(new RoadEntity(r[0], r[1], Integer.parseInt(r[2]), true));
            }
        }
        for (RoadEntity re : roadRepo.findAll()) {
            roadGraph.addRoad(re.getSource(), re.getDestination(), re.getTravelTime());
            roadGraph.updateRoadStatus(re.getSource(), re.getDestination(), re.isOpen());
        }

        // ==========================================
        // 6. RELIEF REQUESTS
        // ==========================================
        if (requestRepo.count() == 0 && !regions.isEmpty()) {
            AffectedRegion r1 = regions.get(0);
            int reqId1 = nextRequestId.getAndIncrement();
            int arr1 = nextArrivalOrder.getAndIncrement();
            SupplyRequest sampleSupply = new SupplyRequest(reqId1, r1, r1.getSeverity(), r1.getPopulation(), arr1, 100, 60);

            ReliefRequestEntity e1 = new ReliefRequestEntity(reqId1, "SUPPLY", r1.getRegionName(), r1.getSeverity(), r1.getPopulation(), arr1, "WAITING");
            e1.setFoodRequired(100);
            e1.setMedicineRequired(60);
            requestRepo.save(e1);

            requestManager.addRequest(sampleSupply);
            requestHistory.add(sampleSupply);

            if (regions.size() > 1) {
                AffectedRegion r2 = regions.get(1);
                int reqId2 = nextRequestId.getAndIncrement();
                int arr2 = nextArrivalOrder.getAndIncrement();
                RescueRequest sampleRescue = new RescueRequest(reqId2, r2, r2.getSeverity(), r2.getPopulation(), arr2, 45, 2);

                ReliefRequestEntity e2 = new ReliefRequestEntity(reqId2, "RESCUE", r2.getRegionName(), r2.getSeverity(), r2.getPopulation(), arr2, "WAITING");
                e2.setPeopleToRescue(45);
                e2.setTeamsRequired(2);
                requestRepo.save(e2);

                requestManager.addRequest(sampleRescue);
                requestHistory.add(sampleRescue);
            }
        } else {
            // Load existing requests from DB into operational structures
            for (ReliefRequestEntity re : requestRepo.findAll()) {
                AffectedRegion reg = findRegionByName(re.getRegionName());
                if (reg == null) {
                    reg = new AffectedRegion(999, re.getRegionName(), re.getAffectedPopulation(), re.getSeverity(), true);
                }

                ReliefRequest req;
                if ("SUPPLY".equalsIgnoreCase(re.getRequestType())) {
                    SupplyRequest sReq = new SupplyRequest(
                            re.getRequestId(),
                            reg,
                            re.getSeverity(),
                            re.getAffectedPopulation(),
                            re.getArrivalOrder(),
                            re.getFoodRequired(),
                            re.getMedicineRequired()
                    );
                    sReq.allocateFood(re.getFoodAllocated());
                    sReq.allocateMedicine(re.getMedicineAllocated());
                    sReq.setStatus(re.getStatus());
                    sReq.setFoodArchived(re.isFoodArchived());
                    sReq.setMedicineArchived(re.isMedicineArchived());
                    req = sReq;
                } else {
                    RescueRequest rReq = new RescueRequest(
                            re.getRequestId(),
                            reg,
                            re.getSeverity(),
                            re.getAffectedPopulation(),
                            re.getArrivalOrder(),
                            re.getPeopleToRescue(),
                            re.getTeamsRequired()
                    );
                    rReq.setStatus(re.getStatus());
                    rReq.setAssignedTeamId(re.getAssignedTeamId());
                    req = rReq;
                }

                requestHistory.add(req);
                if (("WAITING".equalsIgnoreCase(re.getStatus()) || "PARTIALLY_FULFILLED".equalsIgnoreCase(re.getStatus())) && !re.isArchived()) {
                    requestManager.addRequest(req);
                } else if ("IN_PROGRESS".equalsIgnoreCase(re.getStatus()) && req instanceof RescueRequest rReq) {
                    resourceManager.addActiveRescueRequest(rReq);
                    if (re.getAssignedTeamId() != null) {
                        RescueTeam assignedTeam = resourceManager.findTeamById(re.getAssignedTeamId());
                        if (assignedTeam != null) {
                            ArrayList<RescueTeam> teams = new ArrayList<>();
                            teams.add(assignedTeam);
                            resourceManager.trackRescueMission(rReq, teams);
                        }
                    }
                }

                if (re.getRequestId() >= nextRequestId.get()) {
                    nextRequestId.set(re.getRequestId() + 1);
                }
                if (re.getArrivalOrder() >= nextArrivalOrder.get()) {
                    nextArrivalOrder.set(re.getArrivalOrder() + 1);
                }
            }
        }
    }

    // ==========================================
    // 1. DASHBOARD OVERVIEW
    // ==========================================
    public Map<String, Object> getDashboardStats() {
        int totalTeams = resourceManager.getRescueTeams().size();
        long availableTeams = resourceManager.getRescueTeams().stream().filter(RescueTeam::isAvailable).count();
        int foodKits = resourceManager.getStock() != null ? resourceManager.getStock().getFoodKits() : 0;
        int medKits = resourceManager.getStock() != null ? resourceManager.getStock().getMedicineKits() : 0;
        int totalShelters = resourceManager.getShelters().size();
        int totalCapacity = resourceManager.getShelters().stream().mapToInt(Shelter::getCapacity).sum();
        int totalOccupied = resourceManager.getShelters().stream().mapToInt(Shelter::getOccupied).sum();
        long pendingRequests = requestHistory.stream().filter(r -> "WAITING".equals(r.getStatus()) || "PARTIALLY_FULFILLED".equals(r.getStatus())).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRegions", regions.size());
        stats.put("totalTeams", totalTeams);
        stats.put("availableTeams", availableTeams);
        stats.put("foodKits", foodKits);
        stats.put("medicineKits", medKits);
        stats.put("pendingRequests", pendingRequests);
        stats.put("totalShelters", totalShelters);
        stats.put("shelterCapacity", totalCapacity);
        stats.put("shelterOccupied", totalOccupied);
        return stats;
    }

    // ==========================================
    // 2. AFFECTED REGIONS
    // ==========================================
    public List<AffectedRegion> getRegions(boolean prioritySorted) {
        String mainDepot = "Aruvi Village";
        for (AffectedRegion r : regions) {
            String rName = r.getRegionName();
            boolean hasRoads = !roadGraph.getRoads(rName).isEmpty();
            r.setHasRoadMapping(hasRoads);
            if (!hasRoads) {
                r.setNetworkReachable(false);
            } else if (mainDepot.equalsIgnoreCase(rName)) {
                r.setNetworkReachable(true);
            } else {
                Map<String, Object> shortest = getShortestRouteInternal(mainDepot, rName);
                boolean reachable = Boolean.TRUE.equals(shortest.get("reachable"));
                r.setNetworkReachable(reachable);
            }
        }

        if (!prioritySorted) {
            return new ArrayList<>(regions);
        }

        List<AffectedRegion> sorted = new ArrayList<>(regions);
        sorted.sort(Comparator.comparingInt(AffectedRegion::getSeverity).reversed()
                .thenComparing(Comparator.comparingInt(AffectedRegion::getPopulation).reversed())
                .thenComparingInt(AffectedRegion::getRegionId));
        return sorted;
    }

    public synchronized AffectedRegion addRegion(AffectedRegion region) {
        if (region.getRegionId() <= 0) {
            int maxId = regions.stream().mapToInt(AffectedRegion::getRegionId).max().orElse(0);
            region = new AffectedRegion(maxId + 1, region.getRegionName(), region.getPopulation(), region.getSeverity(), region.isAccessible(), region.getDisasterType(), region.getDescription());
        }

        for (AffectedRegion existing : regions) {
            if (existing.getRegionId() == region.getRegionId() ||
                    existing.getRegionName().equalsIgnoreCase(region.getRegionName().trim())) {
                throw new IllegalArgumentException("A region with ID #" + region.getRegionId() + " or name '" + region.getRegionName() + "' already exists.");
            }
        }

        // Persist to MariaDB
        regionRepo.save(new AffectedRegionEntity(
                region.getRegionId(),
                region.getRegionName().trim(),
                region.getPopulation(),
                region.getSeverity(),
                region.isAccessible(),
                region.getDisasterType(),
                region.getDescription()
        ));

        regions.add(region);
        return region;
    }

    public AffectedRegion getHighestNeedRegion() {
        if (regions.isEmpty()) return null;
        return regions.stream()
                .max(Comparator.comparingInt(AffectedRegion::getSeverity)
                        .thenComparingInt(AffectedRegion::getPopulation))
                .orElse(null);
    }

    public AffectedRegion findRegionById(int regionId) {
        return regions.stream().filter(r -> r.getRegionId() == regionId).findFirst().orElse(null);
    }

    public AffectedRegion findRegionByName(String name) {
        if (name == null) return null;
        return regions.stream().filter(r -> r.getRegionName().equalsIgnoreCase(name.trim())).findFirst().orElse(null);
    }

    // ==========================================
    // 3. RESOURCE INVENTORY
    // ==========================================
    public Map<String, Integer> getInventory() {
        ResourceStock stock = resourceManager.getStock();
        Map<String, Integer> res = new LinkedHashMap<>();
        res.put("foodKits", stock != null ? stock.getFoodKits() : 0);
        res.put("medicineKits", stock != null ? stock.getMedicineKits() : 0);
        return res;
    }

    public synchronized Map<String, Integer> updateInventory(int foodQuantity, int medicineQuantity) {
        resourceManager.addNewStock(foodQuantity, medicineQuantity);

        // Persist updated stock in MariaDB
        var stockEntities = stockRepo.findAll();
        ResourceStockEntity stockEntity;
        if (stockEntities.isEmpty()) {
            stockEntity = new ResourceStockEntity(resourceManager.getStock().getFoodKits(), resourceManager.getStock().getMedicineKits());
        } else {
            stockEntity = stockEntities.get(0);
            stockEntity.setFoodKits(resourceManager.getStock().getFoodKits());
            stockEntity.setMedicineKits(resourceManager.getStock().getMedicineKits());
            stockEntity.setLastUpdated(java.time.LocalDateTime.now());
        }
        stockRepo.save(stockEntity);

        return getInventory();
    }

    // ==========================================
    // 4. RESCUE TEAMS
    // ==========================================
    public List<RescueTeam> getRescueTeams() {
        return new ArrayList<>(resourceManager.getRescueTeams());
    }

    public synchronized RescueTeam addRescueTeam(RescueTeam team) {
        if (team.getTeamId() <= 0) {
            int maxId = resourceManager.getRescueTeams().stream().mapToInt(RescueTeam::getTeamId).max().orElse(0);
            team = new RescueTeam(maxId + 1, team.getTeamName(), team.getCurrentLocation());
        }

        RescueTeam existing = resourceManager.findTeamById(team.getTeamId());
        if (existing != null) {
            throw new IllegalArgumentException("Rescue Team #" + team.getTeamId() + " already exists.");
        }

        // Persist to MariaDB
        teamRepo.save(new RescueTeamEntity(
                team.getTeamId(),
                team.getTeamName(),
                team.getCurrentLocation(),
                team.isAvailable()
        ));

        resourceManager.addRescueTeam(team);
        return team;
    }

    public synchronized boolean updateTeamStatus(int teamId, boolean available) {
        boolean updated = resourceManager.updateTeamAvailability(teamId, available);
        if (updated) {
            teamRepo.findById(teamId).ifPresent(entity -> {
                entity.setAvailable(available);
                teamRepo.save(entity);
            });
        }
        return updated;
    }

    public synchronized boolean completeRescueMission(int requestId) {
        if (requestId <= 0) {
            throw new IllegalArgumentException("Invalid Rescue Request ID #" + requestId + ". Must be a positive integer.");
        }

        ReliefRequest req = null;
        for (ReliefRequest r : requestHistory) {
            if (r.getRequestId() == requestId) {
                req = r;
                break;
            }
        }

        ReliefRequestEntity entity = requestRepo.findById(requestId).orElse(null);
        if (req == null && entity == null) {
            throw new IllegalArgumentException("Rescue Request #" + requestId + " does not exist in the system.");
        }

        // Validate that it is a RESCUE request
        boolean isRescue = (req instanceof RescueRequest) ||
                (entity != null && "RESCUE".equalsIgnoreCase(entity.getRequestType()));
        if (!isRescue) {
            String type = req != null ? req.getRequestType() : entity.getRequestType();
            throw new IllegalArgumentException("Request #" + requestId + " is a " + type + " Request, not an Emergency Rescue mission.");
        }

        String currentStatus = req != null ? req.getStatus() : entity.getStatus();
        if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Rescue mission #" + requestId + " is already marked COMPLETED.");
        }
        if ("WAITING".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Rescue mission #" + requestId + " is currently in WAITING status (no rescue teams have been dispatched yet).");
        }

        // Determine ONLY the rescue teams assigned to this specific request
        java.util.Set<Integer> assignedTeamIds = new java.util.LinkedHashSet<>();

        // 1. Check in-memory assigned teams tracked during dispatch
        ArrayList<RescueTeam> assignedMemoryTeams = resourceManager.getAssignedTeams(requestId);
        if (assignedMemoryTeams != null) {
            for (RescueTeam t : assignedMemoryTeams) {
                assignedTeamIds.add(t.getTeamId());
            }
        }

        // 2. Check DB entity assigned team ID
        if (entity != null && entity.getAssignedTeamId() != null) {
            assignedTeamIds.add(entity.getAssignedTeamId());
        }

        // Complete via in-memory resourceManager
        resourceManager.completeRescueMission(requestId);

        // Update request status in memory
        if (req != null) {
            req.setStatus("COMPLETED");
        }

        // Update request status in MariaDB
        if (entity != null) {
            entity.setStatus("COMPLETED");
            requestRepo.save(entity);
        }

        // Release ONLY the rescue teams assigned to this request
        for (Integer teamId : assignedTeamIds) {
            resourceManager.updateTeamAvailability(teamId, true);
            teamRepo.findById(teamId).ifPresent(te -> {
                te.setAvailable(true);
                teamRepo.save(te);
            });
        }

        // Remove from waiting queue if present
        requestManager.removeRequest(requestId);
        return true;
    }

    // ==========================================
    // 5. SHELTERS
    // ==========================================
    public List<Shelter> getShelters() {
        return new ArrayList<>(resourceManager.getShelters());
    }

    public synchronized Shelter addShelter(Shelter shelter) {
        if (shelter.getShelterId() <= 0) {
            int maxId = resourceManager.getShelters().stream().mapToInt(Shelter::getShelterId).max().orElse(0);
            shelter = new Shelter(maxId + 1, shelter.getShelterName(), shelter.getLocation(), shelter.getCapacity());
        }

        for (Shelter s : resourceManager.getShelters()) {
            if (s.getShelterId() == shelter.getShelterId()) {
                throw new IllegalArgumentException("Shelter #" + shelter.getShelterId() + " already exists.");
            }
        }

        // Persist in MariaDB
        shelterRepo.save(new ShelterEntity(
                shelter.getShelterId(),
                shelter.getShelterName(),
                shelter.getLocation(),
                shelter.getCapacity(),
                shelter.getOccupied()
        ));

        resourceManager.addShelter(shelter);
        return shelter;
    }

    public synchronized Shelter allocateShelter(int people) {
        if (people <= 0) {
            throw new IllegalArgumentException("Number of people must be positive.");
        }
        int totalAvailable = resourceManager.getShelters().stream().mapToInt(Shelter::getAvailableSpace).sum();
        if (people > totalAvailable) {
            throw new IllegalStateException("Insufficient shelter capacity for " + people + " evacuees. Total available capacity across all shelters is " + totalAvailable + ".");
        }
        Shelter allocated = resourceManager.allocateShelter(people);
        if (allocated == null) {
            throw new IllegalStateException("No single shelter has sufficient contiguous capacity for " + people + " evacuees. Total available capacity across all facilities is " + totalAvailable + ".");
        }

        // Persist updated occupancy in MariaDB
        shelterRepo.findById(allocated.getShelterId()).ifPresent(se -> {
            se.setOccupied(allocated.getOccupied());
            shelterRepo.save(se);
        });

        return allocated;
    }

    // ==========================================
    // 6. ROADS & ROUTING (DIJKSTRA / BFS / DFS)
    // ==========================================
    public List<Road> getRoadNetwork() {
        List<Road> uniqueRoads = new ArrayList<>();
        Set<String> seenEdges = new HashSet<>();

        for (RoadEntity re : roadRepo.findAll()) {
            String u = re.getSource().trim();
            String v = re.getDestination().trim();
            String edgeKey = u.compareToIgnoreCase(v) < 0 ? u + "<->" + v : v + "<->" + u;

            if (seenEdges.add(edgeKey.toLowerCase())) {
                Road road = new Road(re.getSource(), re.getDestination(), re.getTravelTime());
                road.setOpen(re.isOpen());
                uniqueRoads.add(road);
            }
        }
        return uniqueRoads;
    }

    public synchronized Road addRoad(String source, String destination, int travelTime) {
        roadGraph.addRoad(source, destination, travelTime);

        // Persist in MariaDB
        roadRepo.save(new RoadEntity(source, destination, travelTime, true));

        return new Road(source, destination, travelTime);
    }

    public synchronized boolean updateRoadStatus(String source, String destination, boolean open) {
        boolean updated = roadGraph.updateRoadStatus(source, destination, open);
        roadRepo.findBySourceIgnoreCaseAndDestinationIgnoreCase(source, destination).forEach(re -> {
            re.setOpen(open);
            roadRepo.save(re);
        });
        roadRepo.findBySourceIgnoreCaseAndDestinationIgnoreCase(destination, source).forEach(re -> {
            re.setOpen(open);
            roadRepo.save(re);
        });
        return updated;
    }

    public Map<String, Object> getShortestRoute(String source, String destination) {
        Map<String, Object> result = getShortestRouteInternal(source, destination);
        List<Map<String, Object>> candidateRoutes = getCandidateRoutes(source, destination);
        result.put("candidateRoutes", candidateRoutes);
        return result;
    }

    public String resolveNodeOrRegionName(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String trimmed = input.trim();
        // Check if numeric regionId (e.g. "1" -> "Aruvi Village")
        try {
            int id = Integer.parseInt(trimmed);
            AffectedRegion r = findRegionById(id);
            if (r != null) return r.getRegionName();
        } catch (NumberFormatException ignored) {}

        // Check if matching regionName in regions list
        for (AffectedRegion r : regions) {
            if (r.getRegionName().equalsIgnoreCase(trimmed)) {
                return r.getRegionName();
            }
        }
        // Check in road graph edges
        for (RoadEntity re : roadRepo.findAll()) {
            if (re.getSource().equalsIgnoreCase(trimmed)) return re.getSource();
            if (re.getDestination().equalsIgnoreCase(trimmed)) return re.getDestination();
        }
        return trimmed;
    }

    public Map<String, Object> getRoadReachabilityReport(String depot) {
        String baseDepot = resolveNodeOrRegionName(depot);
        if (baseDepot == null) baseDepot = "Aruvi Village";

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("depot", baseDepot);

        List<Map<String, Object>> regionStatuses = new ArrayList<>();
        for (AffectedRegion r : regions) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("regionId", r.getRegionId());
            item.put("regionName", r.getRegionName());
            item.put("zoneAccessible", r.isAccessible());

            boolean hasRoads = !roadGraph.getRoads(r.getRegionName()).isEmpty();
            item.put("hasRoadMapping", hasRoads);

            if (!hasRoads) {
                item.put("networkReachable", false);
                item.put("status", "UNMAPPED");
            } else if (baseDepot.equalsIgnoreCase(r.getRegionName())) {
                item.put("networkReachable", true);
                item.put("status", "DEPOT_ORIGIN");
            } else {
                Map<String, Object> shortest = getShortestRouteInternal(baseDepot, r.getRegionName());
                boolean reachable = Boolean.TRUE.equals(shortest.get("reachable"));
                item.put("networkReachable", reachable);
                item.put("travelTime", shortest.get("totalTravelTime"));
                item.put("status", reachable ? "REACHABLE" : "CUT_OFF");
            }
            regionStatuses.add(item);
        }
        report.put("regions", regionStatuses);
        return report;
    }

    public Map<String, Object> getShortestRouteInternal(String source, String destination) {
        if (source == null || destination == null) {
            throw new IllegalArgumentException("Source and destination are required.");
        }

        String srcNorm = resolveNodeOrRegionName(source);
        String destNorm = resolveNodeOrRegionName(destination);

        // Check if source or destination is completely unmapped in the road graph
        boolean srcHasRoads = !roadGraph.getRoads(srcNorm).isEmpty();
        boolean destHasRoads = !roadGraph.getRoads(destNorm).isEmpty();

        if (!destHasRoads) {
            Map<String, Object> unmapped = new LinkedHashMap<>();
            unmapped.put("source", srcNorm);
            unmapped.put("destination", destNorm);
            unmapped.put("waypoints", Collections.emptyList());
            unmapped.put("path", Collections.emptyList());
            unmapped.put("totalTravelTime", -1);
            unmapped.put("travelTime", -1);
            unmapped.put("reachable", false);
            unmapped.put("status", "UNMAPPED_DESTINATION");
            unmapped.put("message", "Destination '" + destNorm + "' has no road connections mapped in the road network.");
            return unmapped;
        }

        if (!srcHasRoads) {
            Map<String, Object> unmapped = new LinkedHashMap<>();
            unmapped.put("source", srcNorm);
            unmapped.put("destination", destNorm);
            unmapped.put("waypoints", Collections.emptyList());
            unmapped.put("path", Collections.emptyList());
            unmapped.put("totalTravelTime", -1);
            unmapped.put("travelTime", -1);
            unmapped.put("reachable", false);
            unmapped.put("status", "UNMAPPED_ORIGIN");
            unmapped.put("message", "Origin depot '" + srcNorm + "' has no road connections mapped in the road network.");
            return unmapped;
        }

        // If source and destination are identical
        if (srcNorm.equalsIgnoreCase(destNorm)) {
            Map<String, Object> selfResult = new LinkedHashMap<>();
            selfResult.put("source", srcNorm);
            selfResult.put("destination", destNorm);
            selfResult.put("waypoints", List.of(srcNorm));
            selfResult.put("path", List.of(srcNorm));
            selfResult.put("totalTravelTime", 0);
            selfResult.put("travelTime", 0);
            selfResult.put("reachable", true);
            selfResult.put("status", "AVAILABLE");
            selfResult.put("message", "Origin and destination are the same region (0 mins travel time).");
            return selfResult;
        }

        // Dijkstra implementation with path tracking on OPEN roads
        Map<String, Integer> distance = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        PriorityQueue<String> pq = new PriorityQueue<>(Comparator.comparingInt(distance::get));
        Set<String> processed = new HashSet<>();

        distance.put(srcNorm, 0);
        pq.add(srcNorm);

        while (!pq.isEmpty()) {
            String curr = pq.poll();
            if (!processed.add(curr)) continue;
            if (curr.equalsIgnoreCase(destNorm)) break;

            int currDist = distance.get(curr);
            for (Road road : roadGraph.getRoads(curr)) {
                if (!road.isOpen()) continue;
                String next = road.getDestination();
                if (processed.contains(next)) continue;

                int candidate = currDist + road.getTravelTime();
                if (candidate < distance.getOrDefault(next, Integer.MAX_VALUE)) {
                    distance.put(next, candidate);
                    parent.put(next, curr);
                    pq.remove(next);
                    pq.add(next);
                }
            }
        }

        String matchedDest = null;
        for (String k : distance.keySet()) {
            if (k.equalsIgnoreCase(destNorm)) {
                matchedDest = k;
                break;
            }
        }

        List<String> waypoints = new ArrayList<>();
        int totalTravelTime = -1;

        if (matchedDest != null && distance.get(matchedDest) != Integer.MAX_VALUE) {
            totalTravelTime = distance.get(matchedDest);
            String step = matchedDest;
            while (step != null) {
                waypoints.add(0, step);
                step = parent.get(step);
            }
        }

        boolean reachable = totalTravelTime != -1 && !waypoints.isEmpty();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", srcNorm);
        result.put("destination", destNorm);
        result.put("waypoints", waypoints);
        result.put("path", waypoints);
        result.put("totalTravelTime", totalTravelTime);
        result.put("travelTime", totalTravelTime);
        result.put("reachable", reachable);
        result.put("status", reachable ? "AVAILABLE" : "BLOCKED");

        if (!reachable) {
            boolean hasClosedInboundRoad = roadGraph.getRoads(destNorm).stream().anyMatch(r -> !r.isOpen());
            if (hasClosedInboundRoad) {
                result.put("message", "No open route exists between " + srcNorm + " and " + destNorm + " due to road closures on accessing segments.");
            } else {
                result.put("message", "No route exists between " + srcNorm + " and " + destNorm + " (locations belong to disconnected network components).");
            }
        } else {
            result.put("message", "Optimal route computed: " + totalTravelTime + " minutes.");
        }
        return result;
    }

    public List<Map<String, Object>> getCandidateRoutes(String source, String destination) {
        if (source == null || destination == null) {
            return Collections.emptyList();
        }

        String srcNorm = resolveNodeOrRegionName(source);
        String destNorm = resolveNodeOrRegionName(destination);

        boolean srcHasRoads = !roadGraph.getRoads(srcNorm).isEmpty();
        boolean destHasRoads = !roadGraph.getRoads(destNorm).isEmpty();

        if (!destHasRoads) {
            Map<String, Object> unmapped = new LinkedHashMap<>();
            unmapped.put("routeId", 0);
            unmapped.put("routeName", "No Road Infrastructure Mapped");
            unmapped.put("path", Collections.emptyList());
            unmapped.put("waypoints", Collections.emptyList());
            unmapped.put("totalTravelTime", -1);
            unmapped.put("travelTime", -1);
            unmapped.put("available", false);
            unmapped.put("status", "UNMAPPED_DESTINATION");
            unmapped.put("isRecommended", false);
            unmapped.put("isAlternative", false);
            unmapped.put("message", "Destination '" + destNorm + "' has no road connections mapped in the road network.");
            return List.of(unmapped);
        }

        if (!srcHasRoads) {
            Map<String, Object> unmapped = new LinkedHashMap<>();
            unmapped.put("routeId", 0);
            unmapped.put("routeName", "Origin Depot Not Connected");
            unmapped.put("path", Collections.emptyList());
            unmapped.put("waypoints", Collections.emptyList());
            unmapped.put("totalTravelTime", -1);
            unmapped.put("travelTime", -1);
            unmapped.put("available", false);
            unmapped.put("status", "UNMAPPED_ORIGIN");
            unmapped.put("isRecommended", false);
            unmapped.put("isAlternative", false);
            unmapped.put("message", "Origin depot '" + srcNorm + "' has no road connections mapped in the road network.");
            return List.of(unmapped);
        }

        if (srcNorm.equalsIgnoreCase(destNorm)) {
            Map<String, Object> single = new LinkedHashMap<>();
            single.put("routeId", 1);
            single.put("routeName", "Route 1 (Origin is Destination)");
            single.put("path", List.of(srcNorm));
            single.put("waypoints", List.of(srcNorm));
            single.put("totalTravelTime", 0);
            single.put("travelTime", 0);
            single.put("available", true);
            single.put("status", "AVAILABLE");
            single.put("isRecommended", true);
            single.put("isAlternative", false);
            single.put("costMetric", "travel time (minutes)");
            return List.of(single);
        }

        // 1. Get Dijkstra shortest path on OPEN roads
        Map<String, Object> shortest = getShortestRouteInternal(srcNorm, destNorm);
        @SuppressWarnings("unchecked")
        List<String> shortestPath = (List<String>) shortest.get("path");
        int shortestTime = (int) shortest.get("totalTravelTime");
        boolean shortestReachable = (boolean) shortest.get("reachable");

        // 2. Find candidate simple paths (DFS up to depth 8)
        List<List<String>> allPaths = new ArrayList<>();
        Set<String> visited = new LinkedHashSet<>();
        visited.add(srcNorm);
        findSimplePathsDfs(srcNorm, destNorm, visited, allPaths, 8, 15);

        List<Map<String, Object>> routes = new ArrayList<>();
        Set<String> seenPathSignatures = new HashSet<>();

        // If Dijkstra found a valid path, add it first as recommended
        if (shortestReachable && shortestPath != null && !shortestPath.isEmpty()) {
            String sig = String.join("->", shortestPath);
            seenPathSignatures.add(sig.toLowerCase());

            Map<String, Object> recRoute = new LinkedHashMap<>();
            recRoute.put("routeId", 1);
            recRoute.put("routeName", "Route 1 (Recommended Shortest)");
            recRoute.put("path", shortestPath);
            recRoute.put("waypoints", shortestPath);
            recRoute.put("totalTravelTime", shortestTime);
            recRoute.put("travelTime", shortestTime);
            recRoute.put("available", true);
            recRoute.put("status", "AVAILABLE");
            recRoute.put("isRecommended", true);
            recRoute.put("isAlternative", false);
            recRoute.put("costMetric", "travel time (minutes)");
            routes.add(recRoute);
        }

        List<Map<String, Object>> altRoutes = new ArrayList<>();
        List<Map<String, Object>> blockedRoutes = new ArrayList<>();

        for (List<String> path : allPaths) {
            String sig = String.join("->", path).toLowerCase();
            if (seenPathSignatures.contains(sig)) continue;
            seenPathSignatures.add(sig);

            int pathTime = 0;
            boolean allOpen = true;
            String firstBlockedSegment = null;

            for (int i = 0; i < path.size() - 1; i++) {
                String u = path.get(i);
                String v = path.get(i + 1);

                int edgeTime = 0;
                boolean edgeOpen = true;

                for (Road r : roadGraph.getRoads(u)) {
                    if (r.getDestination().equalsIgnoreCase(v)) {
                        edgeTime = r.getTravelTime();
                        edgeOpen = r.isOpen();
                        break;
                    }
                }

                pathTime += edgeTime;
                if (!edgeOpen) {
                    allOpen = false;
                    if (firstBlockedSegment == null) {
                        firstBlockedSegment = u + " ↔ " + v + " (CLOSED)";
                    }
                }
            }

            Map<String, Object> rMap = new LinkedHashMap<>();
            rMap.put("path", path);
            rMap.put("waypoints", path);
            rMap.put("totalTravelTime", pathTime);
            rMap.put("travelTime", pathTime);
            rMap.put("available", allOpen);
            rMap.put("status", allOpen ? "AVAILABLE" : "BLOCKED");
            rMap.put("costMetric", "travel time (minutes)");
            if (firstBlockedSegment != null) {
                rMap.put("blockedSegment", firstBlockedSegment);
            }

            if (allOpen) {
                altRoutes.add(rMap);
            } else {
                blockedRoutes.add(rMap);
            }
        }

        altRoutes.sort(Comparator.comparingInt(r -> (int) r.get("totalTravelTime")));

        if (routes.isEmpty() && !altRoutes.isEmpty()) {
            Map<String, Object> first = altRoutes.remove(0);
            first.put("routeId", 1);
            first.put("routeName", "Route 1 (Recommended Shortest)");
            first.put("isRecommended", true);
            first.put("isAlternative", false);
            routes.add(first);
        }

        for (Map<String, Object> alt : altRoutes) {
            int routeNum = routes.size() + 1;
            String via = alt.get("path") instanceof List<?> p && p.size() > 2 ? " via " + p.get(1) : "";
            alt.put("routeId", routeNum);
            alt.put("routeName", "Route " + routeNum + " (Alternative" + via + ")");
            alt.put("isRecommended", false);
            alt.put("isAlternative", true);
            routes.add(alt);
            if (routes.size() >= 3) break;
        }

        for (Map<String, Object> blk : blockedRoutes) {
            int routeNum = routes.size() + 1;
            String via = blk.get("path") instanceof List<?> p && p.size() > 2 ? " via " + p.get(1) : "";
            blk.put("routeId", routeNum);
            blk.put("routeName", "Route " + routeNum + " (Blocked" + via + ")");
            blk.put("isRecommended", false);
            blk.put("isAlternative", false);
            routes.add(blk);
            if (routes.size() >= 5) break;
        }

        if (routes.isEmpty()) {
            Map<String, Object> disconn = new LinkedHashMap<>();
            disconn.put("routeId", 0);
            disconn.put("routeName", "No Graph Path Exists");
            disconn.put("path", Collections.emptyList());
            disconn.put("waypoints", Collections.emptyList());
            disconn.put("totalTravelTime", -1);
            disconn.put("travelTime", -1);
            disconn.put("available", false);
            disconn.put("status", "DISCONNECTED_NETWORK");
            disconn.put("isRecommended", false);
            disconn.put("isAlternative", false);
            disconn.put("message", "No road path connects '" + srcNorm + "' and '" + destNorm + "'. The locations belong to disconnected graph components.");
            return List.of(disconn);
        }

        return routes;
    }

    private void findSimplePathsDfs(String current, String target, Set<String> visited,
                                    List<List<String>> result, int maxDepth, int maxPaths) {
        if (result.size() >= maxPaths || visited.size() > maxDepth) {
            return;
        }

        if (current.equalsIgnoreCase(target)) {
            result.add(new ArrayList<>(visited));
            return;
        }

        for (Road road : roadGraph.getRoads(current)) {
            String next = road.getDestination();
            boolean alreadyVisited = false;
            for (String v : visited) {
                if (v.equalsIgnoreCase(next)) {
                    alreadyVisited = true;
                    break;
                }
            }

            if (!alreadyVisited) {
                visited.add(next);
                findSimplePathsDfs(next, target, visited, result, maxDepth, maxPaths);
                visited.remove(next);
            }
        }
    }

    public List<String> getBfsTraversal(String start) {
        return roadGraph.bfs(start);
    }

    public List<String> getDfsTraversal(String start) {
        return roadGraph.dfs(start);
    }

    // ==========================================
    // 7. EMERGENCY RELIEF REQUESTS
    // ==========================================
    public List<ReliefRequest> getRequests() {
        return new ArrayList<>(requestHistory);
    }

    public synchronized SupplyRequest createSupplyRequest(int regionId, int foodRequired, int medicineRequired) {
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            throw new IllegalArgumentException("Region #" + regionId + " not found.");
        }

        int reqId = nextRequestId.getAndIncrement();
        int arr = nextArrivalOrder.getAndIncrement();

        SupplyRequest req = new SupplyRequest(
                reqId,
                region,
                region.getSeverity(),
                region.getPopulation(),
                arr,
                foodRequired,
                medicineRequired
        );
        requestManager.addRequest(req);
        requestHistory.add(req);

        // Persist to MariaDB
        ReliefRequestEntity entity = new ReliefRequestEntity(
                reqId,
                "SUPPLY",
                region.getRegionName(),
                region.getSeverity(),
                region.getPopulation(),
                arr,
                "WAITING"
        );
        entity.setFoodRequired(foodRequired);
        entity.setMedicineRequired(medicineRequired);
        requestRepo.save(entity);

        return req;
    }

    public synchronized RescueRequest createRescueRequest(int regionId, int peopleToRescue, int teamsRequired) {
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            throw new IllegalArgumentException("Region #" + regionId + " not found.");
        }

        int reqId = nextRequestId.getAndIncrement();
        int arr = nextArrivalOrder.getAndIncrement();

        RescueRequest req = new RescueRequest(
                reqId,
                region,
                region.getSeverity(),
                region.getPopulation(),
                arr,
                peopleToRescue,
                teamsRequired
        );
        requestManager.addRequest(req);
        requestHistory.add(req);

        // Persist to MariaDB
        ReliefRequestEntity entity = new ReliefRequestEntity(
                reqId,
                "RESCUE",
                region.getRegionName(),
                region.getSeverity(),
                region.getPopulation(),
                arr,
                "WAITING"
        );
        entity.setPeopleToRescue(peopleToRescue);
        entity.setTeamsRequired(teamsRequired);
        requestRepo.save(entity);

        return req;
    }

    public synchronized Map<String, Object> processNextRequest() {
        if (requestManager.isEmpty()) {
            throw new IllegalStateException("No pending requests in the priority queue.");
        }

        List<ReliefRequest> skippedRequests = new ArrayList<>();
        ReliefRequest chosenReq = null;
        String unfulfillableMessage = null;

        while (!requestManager.isEmpty()) {
            ReliefRequest candidate = requestManager.getNextRequest();
            if (candidate instanceof SupplyRequest supplyReq) {
                ResourceStock stock = resourceManager.getStock();
                int foodInStock = stock != null ? stock.getFoodKits() : 0;
                int medInStock = stock != null ? stock.getMedicineKits() : 0;

                int neededFood = supplyReq.getFoodOutstanding();
                int neededMed = supplyReq.getMedicineOutstanding();

                if (foodInStock == 0 && medInStock == 0) {
                    if (unfulfillableMessage == null) {
                        unfulfillableMessage = "Insufficient warehouse stock for Supply Request #" + supplyReq.getRequestId() +
                                " (needed Food: " + neededFood + ", Meds: " + neededMed + "; available Food: 0, Meds: 0). Request remains queued in WAITING status.";
                    }
                    supplyReq.setStatus("WAITING");
                    skippedRequests.add(candidate);
                } else {
                    chosenReq = candidate;
                    break;
                }
            } else if (candidate instanceof RescueRequest rescueReq) {
                long availableTeamCount = resourceManager.getRescueTeams().stream().filter(RescueTeam::isAvailable).count();
                int teamsRequired = rescueReq.getTeamsRequired();
                int peopleToRescue = rescueReq.getPeopleToRescue();
                int totalShelterAvailable = resourceManager.getShelters().stream().mapToInt(Shelter::getAvailableSpace).sum();

                if (availableTeamCount < teamsRequired) {
                    if (unfulfillableMessage == null) {
                        unfulfillableMessage = "Insufficient available rescue teams for Request #" + rescueReq.getRequestId() +
                                " (needed " + teamsRequired + ", available " + availableTeamCount + "). Request remains queued.";
                    }
                    rescueReq.setStatus("WAITING");
                    skippedRequests.add(candidate);
                } else if (peopleToRescue > 0 && totalShelterAvailable < peopleToRescue) {
                    if (unfulfillableMessage == null) {
                        unfulfillableMessage = "Insufficient shelter capacity for Request #" + rescueReq.getRequestId() +
                                " (needed " + peopleToRescue + " spaces, available " + totalShelterAvailable + "). Request remains queued.";
                    }
                    rescueReq.setStatus("WAITING");
                    skippedRequests.add(candidate);
                } else {
                    chosenReq = candidate;
                    break;
                }
            } else {
                chosenReq = candidate;
                break;
            }
        }

        // Re-queue all skipped requests back into the priority queue
        for (ReliefRequest skipped : skippedRequests) {
            requestManager.addRequest(skipped);
        }

        if (chosenReq == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("processed", true);
            result.put("message", unfulfillableMessage != null ? unfulfillableMessage : "No pending requests could be fulfilled with current resource availability.");
            result.put("request", !skippedRequests.isEmpty() ? skippedRequests.get(0) : null);
            return result;
        }

        ReliefRequest req = chosenReq;
        String message;

        if (req instanceof SupplyRequest supplyReq) {
            ResourceStock stock = resourceManager.getStock();
            int foodInStock = stock != null ? stock.getFoodKits() : 0;
            int medInStock = stock != null ? stock.getMedicineKits() : 0;

            int prevFoodAllocated = supplyReq.getFoodAllocated();
            int prevMedAllocated = supplyReq.getMedicineAllocated();

            resourceManager.processSupplyRequest(supplyReq);

            int newlyAllocatedFood = supplyReq.getFoodAllocated() - prevFoodAllocated;
            int newlyAllocatedMed = supplyReq.getMedicineAllocated() - prevMedAllocated;

            if (newlyAllocatedFood == 0 && newlyAllocatedMed == 0) {
                supplyReq.setStatus(prevFoodAllocated > 0 || prevMedAllocated > 0 ? "PARTIALLY_FULFILLED" : "WAITING");
                requestManager.addRequest(supplyReq);
                message = "Insufficient warehouse stock to allocate for Supply Request #" + supplyReq.getRequestId() +
                        " (Food in stock: " + foodInStock + ", Meds in stock: " + medInStock + "). Request remains queued.";
            } else if (supplyReq.isFullyFulfilled()) {
                supplyReq.setStatus("COMPLETED");
                message = "Fully fulfilled Supply Request #" + supplyReq.getRequestId() +
                        " for " + supplyReq.getRegion().getRegionName() +
                        " (Allocated " + newlyAllocatedFood + " food kits, " + newlyAllocatedMed + " medicine kits). Status: COMPLETED.";
            } else {
                supplyReq.setStatus("PARTIALLY_FULFILLED");
                requestManager.addRequest(supplyReq); // Re-queue outstanding deficit
                message = "Partially fulfilled Supply Request #" + supplyReq.getRequestId() +
                        " for " + supplyReq.getRegion().getRegionName() +
                        " (Allocated " + newlyAllocatedFood + " food kits, " + newlyAllocatedMed + " medicine kits). Food outstanding: " +
                        supplyReq.getFoodOutstanding() + ", Meds outstanding: " + supplyReq.getMedicineOutstanding();
            }

            // Persist status and allocation in DB
            requestRepo.findById(supplyReq.getRequestId()).ifPresent(re -> {
                re.setStatus(supplyReq.getStatus());
                re.setFoodAllocated(supplyReq.getFoodAllocated());
                re.setMedicineAllocated(supplyReq.getMedicineAllocated());
                requestRepo.save(re);
            });

            // Persist updated warehouse inventory
            var stockEntities = stockRepo.findAll();
            if (!stockEntities.isEmpty()) {
                ResourceStockEntity stockEntity = stockEntities.get(0);
                stockEntity.setFoodKits(resourceManager.getStock().getFoodKits());
                stockEntity.setMedicineKits(resourceManager.getStock().getMedicineKits());
                stockRepo.save(stockEntity);
            }
        } else if (req instanceof RescueRequest rescueReq) {
            long availableTeamCount = resourceManager.getRescueTeams().stream().filter(RescueTeam::isAvailable).count();
            int teamsRequired = rescueReq.getTeamsRequired();
            int peopleToRescue = rescueReq.getPeopleToRescue();

            ArrayList<RescueTeam> assigned = resourceManager.allocateRescueTeams(
                    teamsRequired,
                    rescueReq.getRegion().getRegionName()
            );

            if (assigned.size() == teamsRequired) {
                rescueReq.setStatus("IN_PROGRESS");
                if (!assigned.isEmpty()) {
                    rescueReq.setAssignedTeamId(assigned.get(0).getTeamId());
                }
                resourceManager.addActiveRescueRequest(rescueReq);
                resourceManager.trackRescueMission(rescueReq, assigned);

                // Allocate shelter space for evacuees
                if (peopleToRescue > 0) {
                    resourceManager.allocateShelter(peopleToRescue);
                    for (Shelter s : resourceManager.getShelters()) {
                        shelterRepo.findById(s.getShelterId()).ifPresent(se -> {
                            se.setOccupied(s.getOccupied());
                            shelterRepo.save(se);
                        });
                    }
                }

                // Persist status in DB
                requestRepo.findById(rescueReq.getRequestId()).ifPresent(re -> {
                    re.setStatus("IN_PROGRESS");
                    if (!assigned.isEmpty()) {
                        re.setAssignedTeamId(assigned.get(0).getTeamId());
                    }
                    requestRepo.save(re);
                });

                // Persist team availability in DB
                for (RescueTeam t : assigned) {
                    teamRepo.findById(t.getTeamId()).ifPresent(te -> {
                        te.setAvailable(false);
                        te.setCurrentLocation(rescueReq.getRegion().getRegionName());
                        teamRepo.save(te);
                    });
                }

                message = "Dispatched " + assigned.size() + " rescue teams to " +
                        rescueReq.getRegion().getRegionName() + " for Rescue Request #" + rescueReq.getRequestId() +
                        (peopleToRescue > 0 ? " (Accommodated " + peopleToRescue + " evacuees in emergency shelters)" : "");
            } else {
                rescueReq.setStatus("WAITING");
                requestManager.addRequest(rescueReq);
                message = "Insufficient available rescue teams for Request #" + rescueReq.getRequestId() +
                        " (needed " + teamsRequired + ", available " + availableTeamCount + "). Request remains queued.";
            }
        } else {
            message = "Unknown request type processed.";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("processed", true);
        result.put("message", message);
        result.put("request", req);
        return result;
    }

    public synchronized AffectedRegion updateRegion(int regionId, int population, int severity, boolean accessible) {
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            throw new IllegalArgumentException("Region #" + regionId + " not found.");
        }
        region.setPopulation(population);
        region.setSeverity(severity);
        region.setAccessible(accessible);

        regionRepo.findById(regionId).ifPresent(entity -> {
            entity.setPopulation(population);
            entity.setSeverity(severity);
            entity.setAccessible(accessible);
            regionRepo.save(entity);
        });

        return region;
    }

    public synchronized boolean deleteRegion(int regionId) {
        AffectedRegion region = findRegionById(regionId);
        if (region == null) {
            return false;
        }
        regions.remove(region);
        regionRepo.deleteById(regionId);
        return true;
    }

    public synchronized boolean deleteRescueTeam(int teamId) {
        boolean removed = resourceManager.getRescueTeams().removeIf(t -> t.getTeamId() == teamId);
        if (removed) {
            teamRepo.deleteById(teamId);
        }
        return removed;
    }

    public synchronized boolean deleteShelter(int shelterId) {
        boolean removed = resourceManager.getShelters().removeIf(s -> s.getShelterId() == shelterId);
        if (removed) {
            shelterRepo.deleteById(shelterId);
        }
        return removed;
    }

    public synchronized boolean deleteRoad(String source, String destination) {
        boolean removed = roadGraph.removeRoad(source, destination);
        if (removed) {
            roadRepo.findBySourceIgnoreCaseAndDestinationIgnoreCase(source, destination)
                    .forEach(roadRepo::delete);
            roadRepo.findBySourceIgnoreCaseAndDestinationIgnoreCase(destination, source)
                    .forEach(roadRepo::delete);
        }
        return removed;
    }

    public synchronized boolean archiveCompletedRequirement(int requestId, String resourceType) {
        ReliefRequest req = requestHistory.stream().filter(r -> r.getRequestId() == requestId).findFirst().orElse(null);
        if (req == null) {
            throw new IllegalArgumentException("Relief request #" + requestId + " not found.");
        }
        if (!(req instanceof SupplyRequest supplyReq)) {
            throw new IllegalArgumentException("Request #" + requestId + " is not a supply request.");
        }

        String res = resourceType != null ? resourceType.trim().toLowerCase() : "";
        boolean isFood = res.contains("food");
        boolean isMedicine = res.contains("med");

        if (!isFood && !isMedicine) {
            throw new IllegalArgumentException("Resource type must be 'food' or 'medical'.");
        }

        if (isFood) {
            if (supplyReq.getFoodRequired() <= 0) {
                throw new IllegalStateException("Request #" + requestId + " has no food requirement.");
            }
            if (supplyReq.getFoodOutstanding() > 0) {
                throw new IllegalStateException("Cannot delete requirement: Food requirement for " +
                        supplyReq.getRegion().getRegionName() + " is not completed yet (Remaining need: " +
                        supplyReq.getFoodOutstanding() + ").");
            }
            supplyReq.setFoodArchived(true);
        } else {
            if (supplyReq.getMedicineRequired() <= 0) {
                throw new IllegalStateException("Request #" + requestId + " has no medicine requirement.");
            }
            if (supplyReq.getMedicineOutstanding() > 0) {
                throw new IllegalStateException("Cannot delete requirement: Medical requirement for " +
                        supplyReq.getRegion().getRegionName() + " is not completed yet (Remaining need: " +
                        supplyReq.getMedicineOutstanding() + ").");
            }
            supplyReq.setMedicineArchived(true);
        }

        boolean foodDoneOrNotPresent = supplyReq.getFoodRequired() <= 0 || supplyReq.isFoodArchived();
        boolean medDoneOrNotPresent = supplyReq.getMedicineRequired() <= 0 || supplyReq.isMedicineArchived();
        boolean fullyArchived = foodDoneOrNotPresent && medDoneOrNotPresent;

        if (fullyArchived) {
            requestManager.removeRequest(requestId);
        }

        requestRepo.findById(requestId).ifPresent(entity -> {
            entity.setFoodArchived(supplyReq.isFoodArchived());
            entity.setMedicineArchived(supplyReq.isMedicineArchived());
            if (fullyArchived) {
                entity.setArchived(true);
            }
            requestRepo.save(entity);
        });

        return true;
    }

    public synchronized boolean deleteRequest(int requestId) {
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
        if (foodKits > 0) stock.allocateFoodKits(foodKits);
        if (medicalKits > 0) stock.allocateMedicineKits(medicalKits);
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
            re.setFoodAllocated(re.getFoodAllocated() + finalFoodKits);
            re.setMedicineAllocated(re.getMedicineAllocated() + finalMedKits);
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
            rescueReq.setAssignedTeamId(teamId);
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
}
