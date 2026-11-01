package manager;

import model.ReliefRequest;
import java.util.PriorityQueue;
import java.util.Comparator;

public class RequestManager {

    private PriorityQueue<ReliefRequest> requestQueue;

    public RequestManager() {

        requestQueue = new PriorityQueue<>(
            Comparator.comparingInt(ReliefRequest::getSeverity)
                      .reversed()
                      .thenComparing(
                          Comparator.comparingInt(
                              ReliefRequest::getAffectedPopulation
                          ).reversed()
                      )
                      .thenComparingInt(ReliefRequest::getArrivalOrder)
        );
    }

    public void addRequest(ReliefRequest request) {
        requestQueue.add(request);
    }

    public ReliefRequest getNextRequest() {
        return requestQueue.poll();
    }

    public boolean isEmpty() {
        return requestQueue.isEmpty();
    }

    public boolean removeRequest(int requestId) {
        return requestQueue.removeIf(r -> r.getRequestId() == requestId);
    }
}
