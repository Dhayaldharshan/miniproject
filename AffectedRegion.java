package model;

public class AffectedRegion {

    private int regionId;
    private String regionName;
    private int population;
    private int severity;
    private boolean accessible;
    private String disasterType = "General Emergency";
    private String description = "";

    private boolean networkReachable = true;
    private boolean hasRoadMapping = false;

    public AffectedRegion(int regionId, String regionName,
                           int population, int severity,
                           boolean accessible) {

        this.regionId = regionId;
        this.regionName = regionName;
        this.population = population;
        this.severity = severity;
        this.accessible = accessible;
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
    }

    public int getRegionId() {
        return regionId;
    }

    public String getRegionName() {
        return regionName;
    }

    public int getPopulation() {
        return population;
    }

    public int getSeverity() {
        return severity;
    }

    public boolean isAccessible() {
        return accessible;
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
    }

    public boolean isNetworkReachable() {
        return networkReachable;
    }

    public void setNetworkReachable(boolean networkReachable) {
        this.networkReachable = networkReachable;
    }

    public boolean isHasRoadMapping() {
        return hasRoadMapping;
    }

    public void setHasRoadMapping(boolean hasRoadMapping) {
        this.hasRoadMapping = hasRoadMapping;
    }

    public void setPopulation(int population) {
        this.population = population;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public void setAccessible(boolean accessible) {
        this.accessible = accessible;
    }

    @Override
    public String toString() {
        return regionName +
                " | Population: " + population +
                " | Severity: " + severity +
                " | Accessible: " + accessible +
                " | Disaster: " + disasterType;
    }
}
