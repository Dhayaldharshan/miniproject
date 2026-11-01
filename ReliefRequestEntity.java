package com.crisissync.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "relief_requests")
public class ReliefRequestEntity {

    @Id
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "request_type", nullable = false, length = 32)
    private String requestType;

    @Column(name = "region_name", nullable = false, length = 100)
    private String regionName;

    @Column(nullable = false)
    private int severity;

    @Column(name = "affected_population", nullable = false)
    private int affectedPopulation;

    @Column(name = "arrival_order", nullable = false)
    private int arrivalOrder;

    @Column(nullable = false, length = 32)
    private String status = "WAITING";

    @Column(name = "food_required")
    private int foodRequired = 0;

    @Column(name = "medicine_required")
    private int medicineRequired = 0;

    @Column(name = "food_allocated")
    private int foodAllocated = 0;

    @Column(name = "medicine_allocated")
    private int medicineAllocated = 0;

    @Column(name = "people_to_rescue")
    private int peopleToRescue = 0;

    @Column(name = "teams_required")
    private int teamsRequired = 0;

    @Column(name = "assigned_team_id")
    private Integer assignedTeamId;

    @Column(name = "food_archived")
    private Boolean foodArchived = false;

    @Column(name = "medicine_archived")
    private Boolean medicineArchived = false;

    @Column(name = "archived")
    private Boolean archived = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReliefRequestEntity() {}

    public ReliefRequestEntity(Integer requestId, String requestType, String regionName, int severity,
                               int affectedPopulation, int arrivalOrder, String status) {
        this.requestId = requestId;
        this.requestType = requestType;
        this.regionName = regionName;
        this.severity = severity;
        this.affectedPopulation = affectedPopulation;
        this.arrivalOrder = arrivalOrder;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getRegionName() {
        return regionName;
    }

    public void setRegionName(String regionName) {
        this.regionName = regionName;
    }

    public int getSeverity() {
        return severity;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public int getAffectedPopulation() {
        return affectedPopulation;
    }

    public void setAffectedPopulation(int affectedPopulation) {
        this.affectedPopulation = affectedPopulation;
    }

    public int getArrivalOrder() {
        return arrivalOrder;
    }

    public void setArrivalOrder(int arrivalOrder) {
        this.arrivalOrder = arrivalOrder;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getFoodRequired() {
        return foodRequired;
    }

    public void setFoodRequired(int foodRequired) {
        this.foodRequired = foodRequired;
    }

    public int getMedicineRequired() {
        return medicineRequired;
    }

    public void setMedicineRequired(int medicineRequired) {
        this.medicineRequired = medicineRequired;
    }

    public int getFoodAllocated() {
        return foodAllocated;
    }

    public void setFoodAllocated(int foodAllocated) {
        this.foodAllocated = foodAllocated;
    }

    public int getMedicineAllocated() {
        return medicineAllocated;
    }

    public void setMedicineAllocated(int medicineAllocated) {
        this.medicineAllocated = medicineAllocated;
    }

    public int getPeopleToRescue() {
        return peopleToRescue;
    }

    public void setPeopleToRescue(int peopleToRescue) {
        this.peopleToRescue = peopleToRescue;
    }

    public int getTeamsRequired() {
        return teamsRequired;
    }

    public void setTeamsRequired(int teamsRequired) {
        this.teamsRequired = teamsRequired;
    }

    public Integer getAssignedTeamId() {
        return assignedTeamId;
    }

    public void setAssignedTeamId(Integer assignedTeamId) {
        this.assignedTeamId = assignedTeamId;
    }

    public boolean isFoodArchived() {
        return Boolean.TRUE.equals(foodArchived);
    }

    public void setFoodArchived(Boolean foodArchived) {
        this.foodArchived = Boolean.TRUE.equals(foodArchived);
    }

    public boolean isMedicineArchived() {
        return Boolean.TRUE.equals(medicineArchived);
    }

    public void setMedicineArchived(Boolean medicineArchived) {
        this.medicineArchived = Boolean.TRUE.equals(medicineArchived);
    }

    public boolean isArchived() {
        return Boolean.TRUE.equals(archived);
    }

    public void setArchived(Boolean archived) {
        this.archived = Boolean.TRUE.equals(archived);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
