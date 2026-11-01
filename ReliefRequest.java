
package model;

public abstract class ReliefRequest {

    protected int requestId;
    protected AffectedRegion region;
    protected int severity;
    protected int affectedPopulation;
    protected int arrivalOrder;
    protected String status;

    public ReliefRequest(int requestId,
                         AffectedRegion region,
                         int severity,
                         int affectedPopulation,
                         int arrivalOrder) {

        this.requestId = requestId;
        this.region = region;
        this.severity = severity;
        this.affectedPopulation = affectedPopulation;
        this.arrivalOrder = arrivalOrder;
        this.status = "WAITING";
    }

    public int getRequestId() {
        return requestId;
    }

    public AffectedRegion getRegion() {
        return region;
    }

    public int getSeverity() {
        return severity;
    }

    public int getAffectedPopulation() {
        return affectedPopulation;
    }

    public int getArrivalOrder() {
        return arrivalOrder;
    }

    public String getStatus() {
        return status;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public abstract String getRequestType();

    @Override
    public String toString() {
        return "Request ID: " + requestId +
                " | Region: " + region.getRegionName() +
                " | Severity: " + severity +
                " | Population: " + affectedPopulation +
                " | Arrival: " + arrivalOrder +
                " | Type: " + getRequestType() +
                " | Status: " + status;
    }
}