package com.crisissync.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roads")
public class RoadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "road_id")
    private Long roadId;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "travel_time", nullable = false)
    private int travelTime;

    @Column(name = "is_open", nullable = false)
    private boolean open = true;

    public RoadEntity() {}

    public RoadEntity(String source, String destination, int travelTime, boolean open) {
        this.source = source;
        this.destination = destination;
        this.travelTime = travelTime;
        this.open = open;
    }

    public Long getRoadId() {
        return roadId;
    }

    public void setRoadId(Long roadId) {
        this.roadId = roadId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public int getTravelTime() {
        return travelTime;
    }

    public void setTravelTime(int travelTime) {
        this.travelTime = travelTime;
    }

    public boolean isOpen() {
        return open;
    }

    public void setOpen(boolean open) {
        this.open = open;
    }
}
