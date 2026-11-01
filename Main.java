import manager.RequestManager;
import manager.ResourceManager;
import model.AffectedRegion;
import model.ReliefRequest;
import model.RescueRequest;
import model.RescueTeam;
import model.SupplyRequest;
import model.Shelter;
import graph.Graph;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.PriorityQueue;
import java.util.Scanner;
import java.util.Set;

public class Main {

    private static int nextRequestId = 1001;
    private static int nextArrivalOrder = 1;

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        ArrayList<AffectedRegion> regions = new ArrayList<>();
        Set<Integer> assessedRegionIds = new HashSet<>();

        RequestManager requestManager = new RequestManager();
        ResourceManager resourceManager = new ResourceManager();
        Graph graph = new Graph();
        int choice;

        do {
            showMenu();
            choice = readInt(scanner, "Enter your choice: ");

            switch (choice) {
                case 1:
                    addAffectedRegion(scanner, regions);
                    break;

                case 2:
                    viewAllRegions(regions);
                    break;

                case 3:
                    viewRegionsByPriority(regions);
                    break;

                case 4:
                    collectNeedForHighestPriorityRegion(
                            scanner,
                            regions,
                            assessedRegionIds,
                            requestManager
                    );
                    break;

                case 5:
                    addNewStock(scanner, resourceManager);
                    break;

                case 6:
                    viewCurrentStock(resourceManager);
                    break;

                case 7:
                    processNextPriorityRequest(
                            requestManager,
                            resourceManager
                    );
                    break;
                case 8:
                    addRescueTeam(scanner, resourceManager);
                    break;

                case 9:
                    viewRescueTeams(resourceManager);
                    break;

                case 10:
                    updateRescueTeamStatus(scanner, resourceManager);
                    break;
                case 11:
                    System.out.print("Enter Rescue Request ID to complete: ");
                    int requestId = scanner.nextInt();

                    boolean completed =
                    resourceManager.completeRescueMission(requestId);

                    if (completed) {
                    System.out.println("Rescue mission completed successfully!");
                    System.out.println("Assigned teams are now AVAILABLE.");
                    } else {
                    System.out.println("Active rescue mission not found.");
                    }
                    break;   
                     
                case 12:
                    addShelter(scanner, resourceManager);
                     break;

                case 13:
                     viewShelters(resourceManager);
                    break;

                case 14:
                     allocateShelter(scanner, resourceManager);
                    break;
                
                case 15:
                    addRoad(scanner, graph);
                    break;

                case 16:
                    graph.displayRoads();
                    break;

                case 17:
                     updateRoadStatus(scanner, graph);
                     break;

                     
                case 18:
                    traverseBFS(scanner, graph);
                    break;

                case 19:
                     traverseDFS(scanner, graph);
                    break;

case 20:
    findShortestRoutes(scanner, graph);
    break;


                case 0:
                    System.out.println("Exiting Disaster Management System...");
                    break;

                default:
                    System.out.println("Invalid choice. Please try again.");
            }

            System.out.println();

        } while (choice != 0);

        scanner.close();
    }

    public static void showMenu() {
        System.out.println("=== Disaster Management Resource Allocation ===");
        System.out.println("1. Add Affected Region");
        System.out.println("2. View All Affected Regions");
        System.out.println("3. View Regions by Priority");
        System.out.println("4. Get Need for Highest-Priority Region");
        System.out.println("5. Add New Food / Medicine Stock");
        System.out.println("6. View Current Stock");
        System.out.println("7. Process Next Priority Request");
        System.out.println("8. Add Rescue Team");
        System.out.println("9. View Rescue Teams");
        System.out.println("10. Update Rescue Team Status");
       System.out.println("11. Complete Rescue Mission");
       System.out.println("12. Add Shelter");
        System.out.println("13. View Shelters");
        System.out.println("14. Allocate Shelter");
        System.out.println("15. Add Road");
        System.out.println("16. View Road Network");
        System.out.println("17. Update Road Status");
        System.out.println("18. BFS - Traverse Regions");
        System.out.println("19. DFS - Traverse Regions");
        System.out.println("20. Dijkstra - Shortest Travel Time");

        System.out.println("0. Exit");
    }

    public static void addAffectedRegion(
            Scanner scanner,
            ArrayList<AffectedRegion> regions) {

        System.out.println("--- Add Affected Region ---");

        int regionId = readInt(scanner, "Enter Region ID: ");

        System.out.print("Enter Region Name: ");
        String regionName = scanner.nextLine();

        int population = readInt(scanner, "Enter Population: ");

        int severity;

        do {
            severity = readInt(scanner, "Enter Severity (1 to 5): ");

            if (severity < 1 || severity > 5) {
                System.out.println("Severity must be between 1 and 5.");
            }

        } while (severity < 1 || severity > 5);

        System.out.print("Is the region accessible? (yes/no): ");
        String accessibilityInput = scanner.nextLine();

        boolean accessible = accessibilityInput.equalsIgnoreCase("yes");

        AffectedRegion region = new AffectedRegion(
                regionId,
                regionName,
                population,
                severity,
                accessible
        );

        regions.add(region);

        System.out.println("Affected region added successfully.");
    }

    public static void viewAllRegions(
            ArrayList<AffectedRegion> regions) {

        if (regions.isEmpty()) {
            System.out.println("No affected regions have been added yet.");
            return;
        }

        System.out.println("--- All Affected Regions ---");

        for (AffectedRegion region : regions) {
            System.out.println(region);
        }
    }

    public static PriorityQueue<AffectedRegion> createRegionPriorityQueue(
            ArrayList<AffectedRegion> regions,
            Set<Integer> assessedRegionIds) {

        Comparator<AffectedRegion> regionComparator =
                Comparator.comparingInt(AffectedRegion::getSeverity)
                        .reversed()
                        .thenComparing(
                                Comparator.comparingInt(
                                        AffectedRegion::getPopulation
                                ).reversed()
                        )
                        .thenComparingInt(
                                region -> regions.indexOf(region)
                        );

        PriorityQueue<AffectedRegion> regionQueue =
                new PriorityQueue<>(regionComparator);

        for (AffectedRegion region : regions) {
            if (!assessedRegionIds.contains(region.getRegionId())) {
                regionQueue.add(region);
            }
        }

        return regionQueue;
    }

    public static void viewRegionsByPriority(
            ArrayList<AffectedRegion> regions) {

        if (regions.isEmpty()) {
            System.out.println("No affected regions have been added yet.");
            return;
        }

        PriorityQueue<AffectedRegion> regionQueue =
                createRegionPriorityQueue(regions, new HashSet<>());

        System.out.println("--- Regions in Priority Order ---");

        while (!regionQueue.isEmpty()) {
            System.out.println(regionQueue.poll());
        }
    }

    public static void collectNeedForHighestPriorityRegion(
            Scanner scanner,
            ArrayList<AffectedRegion> regions,
            Set<Integer> assessedRegionIds,
            RequestManager requestManager) {

        PriorityQueue<AffectedRegion> regionQueue =
                createRegionPriorityQueue(regions, assessedRegionIds);

        if (regionQueue.isEmpty()) {
            System.out.println("All regions already have their needs recorded.");
            return;
        }

        AffectedRegion region = regionQueue.poll();

        System.out.println("--- Highest-Priority Region ---");
        System.out.println(region);

        int needChoice;

        do {
            System.out.println("What does this region need?");
            System.out.println("1. Supply");
            System.out.println("2. Rescue");
            System.out.println("3. Both");

            needChoice = readInt(scanner, "Enter your choice: ");

            if (needChoice < 1 || needChoice > 3) {
                System.out.println("Please choose 1, 2, or 3.");
            }

        } while (needChoice < 1 || needChoice > 3);

        if (needChoice == 1 || needChoice == 3) {
            createSupplyRequest(scanner, region, requestManager);
        }

        if (needChoice == 2 || needChoice == 3) {
            createRescueRequest(scanner, region, requestManager);
        }

        assessedRegionIds.add(region.getRegionId());

        System.out.println("Need recorded for "
                + region.getRegionName() + ".");
    }

    public static void createSupplyRequest(
            Scanner scanner,
            AffectedRegion region,
            RequestManager requestManager) {

        int foodRequired =
                readInt(scanner, "Enter food kits required: ");

        int medicineRequired =
                readInt(scanner, "Enter medicine kits required: ");

        ReliefRequest supplyRequest = new SupplyRequest(
                nextRequestId++,
                region,
                region.getSeverity(),
                region.getPopulation(),
                nextArrivalOrder++,
                foodRequired,
                medicineRequired
        );

        requestManager.addRequest(supplyRequest);

        System.out.println("Supply request created.");
    }

    public static void createRescueRequest(
            Scanner scanner,
            AffectedRegion region,
            RequestManager requestManager) {

        int peopleToRescue =
                readInt(scanner, "Enter people to rescue: ");

        int teamsRequired =
                readInt(scanner, "Enter rescue teams required: ");

        ReliefRequest rescueRequest = new RescueRequest(
                nextRequestId++,
                region,
                region.getSeverity(),
                region.getPopulation(),
                nextArrivalOrder++,
                peopleToRescue,
                teamsRequired
        );

        requestManager.addRequest(rescueRequest);
        System.out.println("Rescue Request ID: " + rescueRequest.getRequestId());
        System.out.println("Rescue request created.");
    }

    public static void addNewStock(
            Scanner scanner,
            ResourceManager resourceManager) {

        System.out.println("--- Add New Resource Stock ---");

        int foodQuantity =
                readInt(scanner, "Enter food kits received: ");

        int medicineQuantity =
                readInt(scanner, "Enter medicine kits received: ");

        if (foodQuantity < 0 || medicineQuantity < 0) {
            System.out.println("Stock quantity cannot be negative.");
            return;
        }

        resourceManager.addNewStock(
                foodQuantity,
                medicineQuantity
        );

        System.out.println("Stock updated successfully.");
        System.out.println("Current Stock: "
                + resourceManager.getStock());
    }

    public static void viewCurrentStock(
            ResourceManager resourceManager) {

        System.out.println("--- Current Resource Stock ---");
        System.out.println(resourceManager.getStock());
    }

    
public static void processNextPriorityRequest(
        RequestManager requestManager,
        ResourceManager resourceManager) {

    if (requestManager.isEmpty()) {
        System.out.println("No waiting requests to process.");
        return;
    }

    ReliefRequest request = requestManager.getNextRequest();

    // SUPPLY REQUEST
    if (request instanceof SupplyRequest) {

        SupplyRequest supplyRequest = (SupplyRequest) request;

        System.out.println("--- Processing Supply Request ---");
        System.out.println("Region: "
                + supplyRequest.getRegion().getRegionName());
        System.out.println("Food required: "
                + supplyRequest.getFoodOutstanding());
        System.out.println("Food available: "
                + resourceManager.getStock().getFoodKits());
        System.out.println("Medicine required: "
                + supplyRequest.getMedicineOutstanding());
        System.out.println("Medicine available: "
                + resourceManager.getStock().getMedicineKits());

        resourceManager.processSupplyRequest(supplyRequest);

        System.out.println("\n--- Allocation Result ---");
        System.out.println(supplyRequest);
        System.out.println("Remaining Stock: "
                + resourceManager.getStock());

        if (supplyRequest.getStatus()
                .equals("PARTIALLY_FULFILLED")) {

            requestManager.addRequest(supplyRequest);

            System.out.println(
                    "Outstanding request remains in waiting queue.");
        }
    }

    // RESCUE REQUEST
    else if (request instanceof RescueRequest) {

        RescueRequest rescueRequest = (RescueRequest) request;

        int teamsRequired = rescueRequest.getTeamsRequired();
        String regionName =
                rescueRequest.getRegion().getRegionName();

        System.out.println("--- Processing Rescue Request ---");
        System.out.println("Region: " + regionName);
        System.out.println("People to rescue: "
                + rescueRequest.getPeopleToRescue());
        System.out.println("Teams required: " + teamsRequired);

        if (teamsRequired <= 0) {
            System.out.println(
                    "Invalid request: teams required must be greater than 0.");
            requestManager.addRequest(rescueRequest);
            return;
        }

        ArrayList<RescueTeam> assignedTeams =
                resourceManager.allocateRescueTeams(
                        teamsRequired, regionName);

        if (assignedTeams.size() == teamsRequired) {

            rescueRequest.setStatus("IN_PROGRESS");
            resourceManager.addActiveRescueRequest(rescueRequest);
            resourceManager.trackRescueMission(
        rescueRequest,
        assignedTeams
);
            System.out.println("\n--- Rescue Allocation Result ---");
            System.out.println("Assigned teams:");

            for (RescueTeam team : assignedTeams) {
                System.out.println(
                        "Team ID: " + team.getTeamId()
                        + ", Name: " + team.getTeamName()
                        + ", Status: BUSY");
            }

            System.out.println("Request Status: IN_PROGRESS");
            System.out.println(
                    "Rescue teams assigned successfully.");

        } else {

            int availableCount = 0;

            for (RescueTeam team :
                    resourceManager.getRescueTeams()) {
                if (team.isAvailable()) {
                    availableCount++;
                }
            }

            rescueRequest.setStatus("WAITING");
            requestManager.addRequest(rescueRequest);

            System.out.println("Not enough available rescue teams.");
            System.out.println("Teams required: " + teamsRequired);
            System.out.println("Teams available: " + availableCount);
            System.out.println(
                    "Request remains in the waiting queue.");
        }
    }
}


    public static int readInt(Scanner scanner, String message) {

        while (true) {
            try {
                System.out.print(message);
                return Integer.parseInt(scanner.nextLine());

            } catch (NumberFormatException exception) {
                System.out.println("Please enter a valid whole number.");
            }
        }
    }
    public static void addRescueTeam(
        Scanner scanner,
        ResourceManager resourceManager) {

    System.out.println("--- Add Rescue Team ---");

    int teamId = readInt(scanner, "Enter Team ID: ");

    System.out.print("Enter Team Name: ");
    String teamName = scanner.nextLine();

    System.out.print("Enter Current Location: ");
    String currentLocation = scanner.nextLine();

    RescueTeam team = new RescueTeam(
            teamId,
            teamName,
            currentLocation
    );

    resourceManager.addRescueTeam(team);

    System.out.println("Rescue team added successfully.");
}


// PASTE viewRescueTeams() HERE

public static void viewRescueTeams(
        ResourceManager resourceManager) {

    System.out.println("--- Rescue Teams ---");

    if (resourceManager.getRescueTeams().isEmpty()) {
        System.out.println("No rescue teams available.");
        return;
    }

    for (RescueTeam team : resourceManager.getRescueTeams()) {
        System.out.println(team);
    }
}


// PASTE updateRescueTeamStatus() HERE

public static void updateRescueTeamStatus(
        Scanner scanner,
        ResourceManager resourceManager) {

    System.out.println("--- Update Rescue Team Status ---");

    int teamId = readInt(scanner, "Enter Team ID: ");

    RescueTeam team = resourceManager.findTeamById(teamId);

    if (team == null) {
        System.out.println("Rescue team not found.");
        return;
    }

    System.out.println("1. AVAILABLE");
    System.out.println("2. BUSY");

    int statusChoice = readInt(scanner, "Enter status: ");

    if (statusChoice == 1) {

        resourceManager.updateTeamAvailability(teamId, true);
        System.out.println("Team status updated to AVAILABLE.");

    } else if (statusChoice == 2) {

        resourceManager.updateTeamAvailability(teamId, false);
        System.out.println("Team status updated to BUSY.");

    } else {

        System.out.println("Invalid status choice.");
    }
}

public static void addRoad(Scanner scanner, Graph graph) {

    System.out.println("--- Add Road ---");

    System.out.print("Enter Source Region: ");
    String source = scanner.nextLine().trim();

    System.out.print("Enter Destination Region: ");
    String destination = scanner.nextLine().trim();

    int travelTime = readInt(scanner, "Enter Travel Time: ");

    graph.addRoad(source, destination, travelTime);
}


public static void updateRoadStatus(Scanner scanner, Graph graph) {

    System.out.println("--- Update Road Status ---");

    System.out.print("Enter Source Region: ");
    String source = scanner.nextLine().trim();

    System.out.print("Enter Destination Region: ");
    String destination = scanner.nextLine().trim();

    System.out.println("1. OPEN");
    System.out.println("2. CLOSED");

    int status = readInt(scanner, "Choose road status: ");

    if (status != 1 && status != 2) {
        System.out.println("Invalid status choice.");
        return;
    }

    boolean open = (status == 1);

    boolean updated =
            graph.updateRoadStatus(source, destination, open);

    if (updated) {
        System.out.println("Road status updated to "
                + (open ? "OPEN" : "CLOSED") + ".");
    } else {
        System.out.println("Road not found. Please check the region names.");
    }
}

public static void addShelter(
        Scanner scanner,
        ResourceManager resourceManager) {

    System.out.println("--- Add Shelter ---");

    int id = readInt(scanner, "Enter Shelter ID: ");

    System.out.print("Enter Shelter Name: ");
    String name = scanner.nextLine();

    System.out.print("Enter Location: ");
    String location = scanner.nextLine();

    int capacity = readInt(scanner, "Enter Total Capacity: ");

    if (capacity <= 0) {
        System.out.println("Capacity must be greater than zero.");
        return;
    }

    Shelter shelter = new Shelter(id, name, location, capacity);
    resourceManager.addShelter(shelter);

    System.out.println("Shelter added successfully.");
}


public static void viewShelters(ResourceManager resourceManager) {

    System.out.println("--- Available Shelters ---");

    if (resourceManager.getShelters().isEmpty()) {
        System.out.println("No shelters have been added.");
        return;
    }

    for (Shelter shelter : resourceManager.getShelters()) {
        System.out.println(shelter);
    }
}


public static void allocateShelter(
        Scanner scanner,
        ResourceManager resourceManager) {

    System.out.println("--- Allocate Shelter ---");

    int people = readInt(scanner, "Enter number of people: ");

    if (people <= 0) {
        System.out.println("Number of people must be greater than zero.");
        return;
    }

    Shelter shelter = resourceManager.allocateShelter(people);

    if (shelter != null) {
        System.out.println("Shelter allocated successfully!");
        System.out.println("Shelter Name: " + shelter.getShelterName());
        System.out.println("Location: " + shelter.getLocation());
        System.out.println("People accommodated: " + people);
        System.out.println("Remaining space: " + shelter.getAvailableSpace());
    } else {
        System.out.println("No shelter has enough available space.");
    }
}
public static void traverseBFS(Scanner scanner, Graph graph) {
    System.out.print("Enter starting region: ");
    String start = scanner.nextLine().trim();

    List<String> result = graph.bfs(start);

    if (result.isEmpty()) {
        System.out.println("Region not found or no open roads available.");
    } else {
        System.out.println("BFS Traversal: " + result);
    }
}

public static void traverseDFS(Scanner scanner, Graph graph) {
    System.out.print("Enter starting region: ");
    String start = scanner.nextLine().trim();

    List<String> result = graph.dfs(start);

    if (result.isEmpty()) {
        System.out.println("Region not found or no open roads available.");
    } else {
        System.out.println("DFS Traversal: " + result);
    }
}

public static void findShortestRoutes(Scanner scanner, Graph graph) {
    System.out.print("Enter starting region: ");
    String start = scanner.nextLine().trim();

    Map<String, Integer> distances = graph.dijkstra(start);

    if (distances.isEmpty()) {
        System.out.println("Region not found.");
        return;
    }

    System.out.println("Shortest Travel Times from " + start + ":");

    for (Map.Entry<String, Integer> entry : distances.entrySet()) {
        if (entry.getValue() == Integer.MAX_VALUE) {
            System.out.println(entry.getKey() + ": Unreachable");
        } else {
            System.out.println(
                entry.getKey() + ": " + entry.getValue()
            );
        }
    }
}
}