package model;

public class SupplyRequest extends ReliefRequest {

    private int foodRequired;
    private int medicineRequired;

    private int foodAllocated;
    private int medicineAllocated;

    private boolean foodArchived = false;
    private boolean medicineArchived = false;

    public SupplyRequest(int requestId,
                         AffectedRegion region,
                         int severity,
                         int affectedPopulation,
                         int arrivalOrder,
                         int foodRequired,
                         int medicineRequired) {

        super(requestId, region, severity,
                affectedPopulation, arrivalOrder);

        this.foodRequired = foodRequired;
        this.medicineRequired = medicineRequired;

        this.foodAllocated = 0;
        this.medicineAllocated = 0;
    }

    public int getFoodRequired() {
        return foodRequired;
    }

    public int getMedicineRequired() {
        return medicineRequired;
    }

    public int getFoodAllocated() {
        return foodAllocated;
    }

    public int getMedicineAllocated() {
        return medicineAllocated;
    }

    public int getFoodOutstanding() {
        return foodRequired - foodAllocated;
    }

    public int getMedicineOutstanding() {
        return medicineRequired - medicineAllocated;
    }

    public void allocateFood(int quantity) {

        if (quantity > 0) {
            foodAllocated = foodAllocated + quantity;
        }
    }

    public void allocateMedicine(int quantity) {

        if (quantity > 0) {
            medicineAllocated = medicineAllocated + quantity;
        }
    }

    public boolean isFullyFulfilled() {
        return getFoodOutstanding() == 0
                && getMedicineOutstanding() == 0;
    }

    public boolean isFoodArchived() {
        return foodArchived;
    }

    public void setFoodArchived(boolean foodArchived) {
        this.foodArchived = foodArchived;
    }

    public boolean isMedicineArchived() {
        return medicineArchived;
    }

    public void setMedicineArchived(boolean medicineArchived) {
        this.medicineArchived = medicineArchived;
    }

    @Override
    public String getRequestType() {
        return "SUPPLY";
    }

    @Override
    public String toString() {
        return super.toString()
                + " | Food Required: " + foodRequired
                + " | Food Allocated: " + foodAllocated
                + " | Food Outstanding: " + getFoodOutstanding()
                + " | Medicine Required: " + medicineRequired
                + " | Medicine Allocated: " + medicineAllocated
                + " | Medicine Outstanding: "
                + getMedicineOutstanding();
    }
}