package com.crisissync.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shelters")
public class ShelterEntity {

    @Id
    @Column(name = "shelter_id")
    private Integer shelterId;

    @Column(name = "shelter_name", nullable = false, length = 100)
    private String shelterName;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private int occupied = 0;

    public ShelterEntity() {}

    public ShelterEntity(Integer shelterId, String shelterName, String location, int capacity, int occupied) {
        this.shelterId = shelterId;
        this.shelterName = shelterName;
        this.location = location;
        this.capacity = capacity;
        this.occupied = occupied;
    }

    public Integer getShelterId() {
        return shelterId;
    }

    public void setShelterId(Integer shelterId) {
        this.shelterId = shelterId;
    }

    public String getShelterName() {
        return shelterName;
    }

    public void setShelterName(String shelterName) {
        this.shelterName = shelterName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getOccupied() {
        return occupied;
    }

    public void setOccupied(int occupied) {
        this.occupied = occupied;
    }
}
