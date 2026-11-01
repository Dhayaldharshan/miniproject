package com.crisissync.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_stock")
public class ResourceStockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "food_kits", nullable = false)
    private int foodKits;

    @Column(name = "medicine_kits", nullable = false)
    private int medicineKits;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public ResourceStockEntity() {}

    public ResourceStockEntity(int foodKits, int medicineKits) {
        this.foodKits = foodKits;
        this.medicineKits = medicineKits;
        this.lastUpdated = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getFoodKits() {
        return foodKits;
    }

    public void setFoodKits(int foodKits) {
        this.foodKits = foodKits;
    }

    public int getMedicineKits() {
        return medicineKits;
    }

    public void setMedicineKits(int medicineKits) {
        this.medicineKits = medicineKits;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
