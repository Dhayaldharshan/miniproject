package model;

public class Shelter {

    private int shelterId;
    private String shelterName;
    private String location;
    private int capacity;
    private int occupied;

    public Shelter(int shelterId, String shelterName,
                   String location, int capacity) {

        this.shelterId = shelterId;
        this.shelterName = shelterName;
        this.location = location;
        this.capacity = capacity;
        this.occupied = 0;
    }

    public int getShelterId() {
        return shelterId;
    }

    public String getShelterName() {
        return shelterName;
    }

    public String getLocation() {
        return location;
    }

    public int getCapacity() {
        return capacity;
    }

    public int getOccupied() {
        return occupied;
    }

    public int getAvailableSpace() {
        return capacity - occupied;
    }

    public boolean reserveSpace(int people) {

        if (people <= getAvailableSpace()) {
            occupied += people;
            return true;
        }

        return false;
    }

    public void releaseSpace(int people) {

        if (people <= occupied) {
            occupied -= people;
        }
    }

    @Override
    public String toString() {
        return "Shelter ID: " + shelterId +
               " | Name: " + shelterName +
               " | Location: " + location +
               " | Capacity: " + capacity +
               " | Occupied: " + occupied +
               " | Available: " + getAvailableSpace();
    }
}