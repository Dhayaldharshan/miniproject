package com.crisissync.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "rescue_teams")
public class RescueTeamEntity {

    @Id
    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "team_name", nullable = false, length = 100)
    private String teamName;

    @Column(name = "current_location", nullable = false, length = 100)
    private String currentLocation;

    @Column(nullable = false)
    private boolean available = true;

    public RescueTeamEntity() {}

    public RescueTeamEntity(Integer teamId, String teamName, String currentLocation, boolean available) {
        this.teamId = teamId;
        this.teamName = teamName;
        this.currentLocation = currentLocation;
        this.available = available;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getCurrentLocation() {
        return currentLocation;
    }

    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
