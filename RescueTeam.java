package model;

public class RescueTeam {

    private int teamId;
    private String teamName;
    private String currentLocation;
    private boolean available;

    public RescueTeam(int teamId, String teamName,
                      String currentLocation) {

        this.teamId = teamId;
        this.teamName = teamName;
        this.currentLocation = currentLocation;
        this.available = true;
    }

    public int getTeamId() {
        return teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public String getCurrentLocation() {
        return currentLocation;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    @Override
    public String toString() {
        return "Team ID: " + teamId +
               " | Name: " + teamName +
               " | Location: " + currentLocation +
               " | Available: " + available;
    }
}