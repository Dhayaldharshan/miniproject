
package manager;

import model.ResourceStock;
import model.RescueTeam;
import model.Shelter;
import model.SupplyRequest;
import model.RescueRequest; 
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
public class ResourceManager {

    private ResourceStock stock;
    private ArrayList<RescueTeam> rescueTeams;
    private ArrayList<Shelter> shelters;
    private ArrayList<RescueRequest> activeRescueRequests;
   private HashMap<RescueRequest, ArrayList<RescueTeam>> activeRescueTeams;
    public ResourceManager() {
        stock = new ResourceStock(0, 0);
        rescueTeams = new ArrayList<>();
        shelters = new ArrayList<>();
        activeRescueRequests = new ArrayList<>();
        activeRescueTeams = new HashMap<>();
    }

    // =========================
    // RESOURCE STOCK MANAGEMENT
    // =========================

    public ResourceStock getStock() {
        return stock;
    }

    public void addNewStock(int foodQuantity, int medicineQuantity) {
        stock.addFoodKits(foodQuantity);
        stock.addMedicineKits(medicineQuantity);
    }

    public void processSupplyRequest(SupplyRequest request) {

        int foodAllocated = stock.allocateFoodKits(
                request.getFoodOutstanding()
        );

        request.allocateFood(foodAllocated);

        int medicineAllocated = stock.allocateMedicineKits(
                request.getMedicineOutstanding()
        );

        request.allocateMedicine(medicineAllocated);

        if (request.isFullyFulfilled()) {
            request.setStatus("COMPLETED");
        } else {
            request.setStatus("PARTIALLY_FULFILLED");
        }
    }

    // =========================
    // RESCUE TEAM MANAGEMENT
    // =========================

    public ArrayList<RescueTeam> getRescueTeams() {
        return rescueTeams;
    }

    public void addRescueTeam(RescueTeam team) {
        rescueTeams.add(team);
    }

    public ArrayList<Shelter> getShelters() {
        return shelters;
    }

    public RescueTeam getAvailableTeam() {

        for (RescueTeam team : rescueTeams) {
            if (team.isAvailable()) {
                return team;
            }
        }

        return null;
    }

    // Find team using Team ID
    public RescueTeam findTeamById(int teamId) {

        for (RescueTeam team : rescueTeams) {
            if (team.getTeamId() == teamId) {
                return team;
            }
        }

        return null;
    }

    // Manually update team availability
    public boolean updateTeamAvailability(
            int teamId,
            boolean available) {

        RescueTeam team = findTeamById(teamId);

        if (team == null) {
            return false;
        }

        team.setAvailable(available);

        return true;
    }
    // Store active rescue request
public void addActiveRescueRequest(RescueRequest request) {
    activeRescueRequests.add(request);
}

// Get active rescue requests
public ArrayList<RescueRequest> getActiveRescueRequests() {
    return activeRescueRequests;
}
    // Allocate required rescue teams to a region
    public ArrayList<RescueTeam> allocateRescueTeams(
            int teamsRequired,
            String regionName) {

        ArrayList<RescueTeam> assignedTeams = new ArrayList<>();

        if (teamsRequired <= 0) {
            return assignedTeams;
        }

        // Count available teams first
        int availableCount = 0;

        for (RescueTeam team : rescueTeams) {
            if (team.isAvailable()) {
                availableCount++;
            }
        }

        // If insufficient teams, do not assign any
        if (availableCount < teamsRequired) {
            return assignedTeams;
        }

        // Assign teams and mark them BUSY
        for (RescueTeam team : rescueTeams) {

            if (team.isAvailable()) {

                team.setAvailable(false);
                team.setCurrentLocation(regionName);
                assignedTeams.add(team);

                if (assignedTeams.size() == teamsRequired) {
                    break;
                }
            }
        }

        return assignedTeams;
    }
// Store rescue request and its assigned teams
public void trackRescueMission(
        RescueRequest request,
        ArrayList<RescueTeam> assignedTeams) {

    activeRescueTeams.put(request, assignedTeams);
}

// Get assigned rescue teams for an active mission
public ArrayList<RescueTeam> getAssignedTeams(int requestId) {
    for (Map.Entry<RescueRequest, ArrayList<RescueTeam>> entry : activeRescueTeams.entrySet()) {
        if (entry.getKey().getRequestId() == requestId) {
            return entry.getValue();
        }
    }
    return null;
}

// Complete a rescue mission
public boolean completeRescueMission(int requestId) {

    RescueRequest requestToComplete = null;

    for (RescueRequest request : activeRescueRequests) {
        if (request.getRequestId() == requestId) {
            requestToComplete = request;
            break;
        }
    }

    if (requestToComplete == null) {
        return false;
    }

    ArrayList<RescueTeam> teams = activeRescueTeams.get(requestToComplete);

    if (teams != null) {
        // Make assigned teams available again
        for (RescueTeam team : teams) {
            team.setAvailable(true);
        }
        activeRescueTeams.remove(requestToComplete);
    }

    // Update request status
    requestToComplete.setStatus("COMPLETED");
    activeRescueRequests.remove(requestToComplete);

    return true;
}
    // =========================
    // SHELTER MANAGEMENT
    // =========================

    public void addShelter(Shelter shelter) {
        shelters.add(shelter);
    }

    public Shelter getAvailableShelter(int people) {

        for (Shelter shelter : shelters) {
            if (shelter.getAvailableSpace() >= people) {
                return shelter;
            }
        }

        return null;
    }
    
public Shelter allocateShelter(int people) {

    if (people <= 0) {
        return null;
    }

    for (Shelter shelter : shelters) {

        if (shelter.reserveSpace(people)) {
            return shelter;
        }
    }

    return null;
}

}
