package model;

public class ResourceStock {

    private int foodKits;
    private int medicineKits;

    public ResourceStock(int foodKits, int medicineKits) {
        this.foodKits = foodKits;
        this.medicineKits = medicineKits;
    }

    public int getFoodKits() {
        return foodKits;
    }

    public int getMedicineKits() {
        return medicineKits;
    }

    public void addFoodKits(int quantity) {

        if (quantity > 0) {
            foodKits = foodKits + quantity;
        }
    }

    public void addMedicineKits(int quantity) {

        if (quantity > 0) {
            medicineKits = medicineKits + quantity;
        }
    }

    public int allocateFoodKits(int requiredQuantity) {

        if (requiredQuantity <= 0) {
            return 0;
        }

        int allocatedQuantity =
                Math.min(requiredQuantity, foodKits);

        foodKits = foodKits - allocatedQuantity;

        return allocatedQuantity;
    }

    public int allocateMedicineKits(int requiredQuantity) {

        if (requiredQuantity <= 0) {
            return 0;
        }

        int allocatedQuantity =
                Math.min(requiredQuantity, medicineKits);

        medicineKits = medicineKits - allocatedQuantity;

        return allocatedQuantity;
    }

    @Override
    public String toString() {
        return "Food Kits: " + foodKits +
                " | Medicine Kits: " + medicineKits;
    }
}