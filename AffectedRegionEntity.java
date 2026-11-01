package com.crisissync.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "affected_regions")
public class AffectedRegionEntity {

    @Id
    @Column(name = "region_id")
    private Integer regionId;

    @Column(name = "region_name", nullable = false, unique = true, length = 100)
    private String regionName;

    @Column(nullable = false)
    private int population;

    @Column(nullable = false)
    private int severity;

    @Column(name = "`accessible`", nullable = false)
    private boolean accessible;

    @Column(name = "disaster_type", length = 100)
    private String disasterType = "General Emergency";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description = "";

    public AffectedRegionEntity() {}

    public AffectedRegionEntity(Integer regionId, String regionName, int population, int severity, boolean accessible) {
        this.regionId = regionId;
        this.regionName = regionName;
        this.population = population;
        this.severity = severity;
        this.accessible = accessible;
        this.disasterType = "General Emergency";
        this.description = "";
    }

    public AffectedRegionEntity(Integer regionId, String regionName, int population, int severity, boolean accessible, String disasterType, String description) {
        this.regionId = regionId;
        this.regionName = regionName;
        this.population = population;
        this.severity = severity;
        this.accessible = accessible;
        this.disasterType = disasterType != null ? disasterType : "General Emergency";
        this.description = description != null ? description : "";
    }

    public Integer getRegionId() {
        return regionId;
    }

    public void setRegionId(Integer regionId) {
        this.regionId = regionId;
    }

    public String getRegionName() {
        return regionName;
    }

    public void setRegionName(String regionName) {
        this.regionName = regionName;
    }

    public int getPopulation() {
        return population;
    }

    public void setPopulation(int population) {
        this.population = population;
    }

    public int getSeverity() {
        return severity;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public boolean isAccessible() {
        return accessible;
    }

    public void setAccessible(boolean accessible) {
        this.accessible = accessible;
    }

    public String getDisasterType() {
        return disasterType;
    }

    public void setDisasterType(String disasterType) {
        this.disasterType = disasterType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
