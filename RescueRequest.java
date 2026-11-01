package model;

public class RescueRequest extends ReliefRequest {

    private int peopleToRescue;
    private int teamsRequired;
    private Integer assignedTeamId;

    public RescueRequest(int requestId,
                         AffectedRegion region,
                         int severity,
                         int affectedPopulation,
                         int arrivalOrder,
                         int peopleToRescue,
                         int teamsRequired) {

        super(requestId, region, severity,
              affectedPopulation, arrivalOrder);

        this.peopleToRescue = peopleToRescue;
        this.teamsRequired = teamsRequired;
    }

    public int getPeopleToRescue() {
        return peopleToRescue;
    }

    public int getTeamsRequired() {
        return teamsRequired;
    }

    public Integer getAssignedTeamId() {
        return assignedTeamId;
    }

    public void setAssignedTeamId(Integer assignedTeamId) {
        this.assignedTeamId = assignedTeamId;
    }

    @Override
    public String getRequestType() {
        return "RESCUE";
    }
}