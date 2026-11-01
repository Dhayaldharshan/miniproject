package graph;

public class Road {
    private String source;
    private String destination;
    private int travelTime;
    private boolean open;

    public Road(String source, String destination, int travelTime) {
        this.source = source;
        this.destination = destination;
        this.travelTime = travelTime;
        this.open = true;
    }

    public String getSource() {
        return source;
    }

    public String getDestination() {
        return destination;
    }

    public int getTravelTime() {
        return travelTime;
    }

    public boolean isOpen() {
        return open;
    }

    public void setOpen(boolean open) {
        this.open = open;
    }

    @Override
    public String toString() {
        return source + " -> " + destination
                + " | Travel Time: " + travelTime
                + " | Status: " + (open ? "OPEN" : "CLOSED");
    }
}
