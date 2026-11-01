
package graph;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

public class Graph {

    private Map<String, List<Road>> adjacencyList;

    public Graph() {
        adjacencyList = new HashMap<>();
    }

    // Add a road between two regions
    public void addRoad(String source, String destination, int travelTime) {

        if (source == null || destination == null
                || source.trim().isEmpty()
                || destination.trim().isEmpty()) {
            System.out.println("Region names cannot be empty.");
            return;
        }

        if (source.equalsIgnoreCase(destination)) {
            System.out.println("Source and destination must be different.");
            return;
        }

        if (travelTime <= 0) {
            System.out.println("Travel time must be greater than zero.");
            return;
        }

        // Prevent duplicate roads
        for (Road road : getRoads(source)) {
            if (road.getDestination().equalsIgnoreCase(destination)) {
                System.out.println("Road already exists.");
                return;
            }
        }

        adjacencyList.putIfAbsent(source, new ArrayList<>());
        adjacencyList.putIfAbsent(destination, new ArrayList<>());

        adjacencyList.get(source).add(
                new Road(source, destination, travelTime));

        adjacencyList.get(destination).add(
                new Road(destination, source, travelTime));

        System.out.println("Road added successfully.");
    }

    // Get roads connected to a region
    public List<Road> getRoads(String region) {
        return adjacencyList.getOrDefault(region, new ArrayList<>());
    }

    // Display the road network
    public void displayRoads() {

        if (adjacencyList.isEmpty()) {
            System.out.println("No roads have been added.");
            return;
        }

        System.out.println("--- Road Network ---");

        for (List<Road> roads : adjacencyList.values()) {
            for (Road road : roads) {
                if (road.getSource().compareToIgnoreCase(
                        road.getDestination()) < 0) {
                    System.out.println(road);
                }
            }
        }
    }

    // Update road status: OPEN or CLOSED
    public boolean updateRoadStatus(
            String source, String destination, boolean open) {

        Road forwardRoad = null;
        Road reverseRoad = null;

        for (Road road : getRoads(source)) {
            if (road.getDestination().equalsIgnoreCase(destination)) {
                forwardRoad = road;
                break;
            }
        }

        for (Road road : getRoads(destination)) {
            if (road.getDestination().equalsIgnoreCase(source)) {
                reverseRoad = road;
                break;
            }
        }

        if (forwardRoad == null || reverseRoad == null) {
            return false;
        }

        forwardRoad.setOpen(open);
        reverseRoad.setOpen(open);

        return true;
    }

    // BFS: Breadth-First Search
    public List<String> bfs(String start) {

        List<String> result = new ArrayList<>();

        String startRegion = findRegionName(start);

        if (startRegion == null) {
            return result;
        }

        Set<String> visited = new LinkedHashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();

        visited.add(startRegion);
        queue.add(startRegion);

        while (!queue.isEmpty()) {

            String current = queue.poll();
            result.add(current);

            for (Road road : getRoads(current)) {

                if (!road.isOpen()) {
                    continue;
                }

                String next = road.getDestination();

                if (visited.add(next)) {
                    queue.add(next);
                }
            }
        }

        return result;
    }

    // DFS: Depth-First Search
    public List<String> dfs(String start) {

        List<String> result = new ArrayList<>();

        String startRegion = findRegionName(start);

        if (startRegion == null) {
            return result;
        }

        Set<String> visited = new LinkedHashSet<>();
        ArrayDeque<String> stack = new ArrayDeque<>();

        stack.push(startRegion);

        while (!stack.isEmpty()) {

            String current = stack.pop();

            if (!visited.add(current)) {
                continue;
            }

            result.add(current);

            List<Road> roads = getRoads(current);

            for (int i = roads.size() - 1; i >= 0; i--) {

                Road road = roads.get(i);

                if (road.isOpen()
                        && !visited.contains(road.getDestination())) {
                    stack.push(road.getDestination());
                }
            }
        }

        return result;
    }

    // Dijkstra: Shortest travel time from the start region
    public Map<String, Integer> dijkstra(String start) {

        Map<String, Integer> distance = new HashMap<>();

        String startRegion = findRegionName(start);

        if (startRegion == null) {
            return distance;
        }

        for (String region : adjacencyList.keySet()) {
            distance.put(region, Integer.MAX_VALUE);
        }

        distance.put(startRegion, 0);

        PriorityQueue<String> queue = new PriorityQueue<>(
                Comparator.comparingInt(distance::get));

        Set<String> processed = new HashSet<>();

        queue.add(startRegion);

        while (!queue.isEmpty()) {

            String current = queue.poll();

            if (!processed.add(current)) {
                continue;
            }

            int currentDistance = distance.get(current);

            for (Road road : getRoads(current)) {

                // Ignore closed roads
                if (!road.isOpen()) {
                    continue;
                }

                String next = road.getDestination();

                if (processed.contains(next)) {
                    continue;
                }

                long candidate =
                        (long) currentDistance + road.getTravelTime();

                if (candidate < distance.get(next)) {

                    distance.put(next, (int) candidate);

                    // Update priority queue with the new distance
                    queue.remove(next);
                    queue.add(next);
                }
            }
        }

        return distance;
    }

    // Find region name without case sensitivity
    private String findRegionName(String name) {

        if (name == null) {
            return null;
        }

        for (String region : adjacencyList.keySet()) {
            if (region.equalsIgnoreCase(name.trim())) {
                return region;
            }
        }
        return null;
    }

    // Remove a road connection between two regions
    public boolean removeRoad(String source, String destination) {
        if (source == null || destination == null) return false;
        boolean removedForward = false;
        boolean removedReverse = false;
        for (String key : adjacencyList.keySet()) {
            if (key.equalsIgnoreCase(source.trim())) {
                removedForward = adjacencyList.get(key).removeIf(r -> r.getDestination().equalsIgnoreCase(destination.trim()));
            }
            if (key.equalsIgnoreCase(destination.trim())) {
                removedReverse = adjacencyList.get(key).removeIf(r -> r.getDestination().equalsIgnoreCase(source.trim()));
            }
        }
        return removedForward || removedReverse;
    }
}
