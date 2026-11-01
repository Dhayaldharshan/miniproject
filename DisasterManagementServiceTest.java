package com.crisissync.service;

import graph.Graph;
import manager.ResourceManager;
import model.RescueTeam;
import model.Shelter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DisasterManagementServiceTest {

    @Test
    @DisplayName("Routing: Direct and multi-hop shortest route computation via Dijkstra")
    void testShortestRouteComputation() {
        Graph graph = new Graph();
        graph.addRoad("Kurinji Nagar", "Mullai Nagar", 10);
        graph.addRoad("Mullai Nagar", "Marutham Nagar", 15);
        graph.addRoad("Kurinji Nagar", "Neithal Nagar", 30);
        graph.addRoad("Neithal Nagar", "Marutham Nagar", 5);

        // Path Kurinji -> Mullai -> Marutham = 25
        // Path Kurinji -> Neithal -> Marutham = 35
        Map<String, Integer> distances = graph.dijkstra("Kurinji Nagar");
        assertNotNull(distances);
        assertEquals(0, distances.get("Kurinji Nagar"));
        assertEquals(10, distances.get("Mullai Nagar"));
        assertEquals(25, distances.get("Marutham Nagar"));
        assertEquals(30, distances.get("Neithal Nagar"));
    }

    @Test
    @DisplayName("Routing: Road closure affects shortest path")
    void testRoadClosureAffectsRouting() {
        Graph graph = new Graph();
        graph.addRoad("Kurinji Nagar", "Mullai Nagar", 10);
        graph.addRoad("Mullai Nagar", "Marutham Nagar", 15);
        graph.addRoad("Kurinji Nagar", "Neithal Nagar", 30);
        graph.addRoad("Neithal Nagar", "Marutham Nagar", 5);

        // Close road between Mullai and Marutham
        boolean updated = graph.updateRoadStatus("Mullai Nagar", "Marutham Nagar", false);
        assertTrue(updated);

        // Now shortest path to Marutham must go via Neithal: 30 + 5 = 35
        Map<String, Integer> distances = graph.dijkstra("Kurinji Nagar");
        assertEquals(35, distances.get("Marutham Nagar"));
    }

    @Test
    @DisplayName("Routing: Unreachable destination handling")
    void testUnreachableRoute() {
        Graph graph = new Graph();
        graph.addRoad("Alpha", "Beta", 10);
        graph.addRoad("Gamma", "Delta", 15);

        Map<String, Integer> distances = graph.dijkstra("Alpha");
        assertEquals(Integer.MAX_VALUE, distances.get("Delta"));
    }

    @Test
    @DisplayName("Shelter: Allocation reserves capacity and rejects when full")
    void testShelterAllocationCapacity() {
        ResourceManager rm = new ResourceManager();
        rm.addShelter(new Shelter(1, "Shelter A", "Zone 1", 50));
        rm.addShelter(new Shelter(2, "Shelter B", "Zone 2", 30));

        // Total available capacity = 80
        int totalAvailable = rm.getShelters().stream().mapToInt(Shelter::getAvailableSpace).sum();
        assertEquals(80, totalAvailable);

        // Allocate 40 into Shelter A
        Shelter s1 = rm.allocateShelter(40);
        assertNotNull(s1);
        assertEquals(1, s1.getShelterId());
        assertEquals(10, s1.getAvailableSpace());

        // Allocate 30 into Shelter B
        Shelter s2 = rm.allocateShelter(30);
        assertNotNull(s2);
        assertEquals(2, s2.getShelterId());
        assertEquals(0, s2.getAvailableSpace());

        // Attempt to allocate 20 more (only 10 remaining across all shelters)
        Shelter s3 = rm.allocateShelter(20);
        assertNull(s3, "Should return null when remaining capacity is insufficient");
    }

    @Test
    @DisplayName("Rescue Teams: Allocation marks busy and release restores availability")
    void testRescueTeamAllocationAndCompletion() {
        ResourceManager rm = new ResourceManager();
        rm.addRescueTeam(new RescueTeam(1, "Alpha Team", "Central"));
        rm.addRescueTeam(new RescueTeam(2, "Bravo Team", "Central"));

        // Allocate 2 teams
        ArrayList<RescueTeam> allocated = rm.allocateRescueTeams(2, "Disaster Zone 1");
        assertEquals(2, allocated.size());
        assertFalse(allocated.get(0).isAvailable());
        assertFalse(allocated.get(1).isAvailable());

        // Verify remaining available teams is 0
        long available = rm.getRescueTeams().stream().filter(RescueTeam::isAvailable).count();
        assertEquals(0, available);

        // Release team 1
        boolean released = rm.updateTeamAvailability(1, true);
        assertTrue(released);
        assertEquals(1, rm.getRescueTeams().stream().filter(RescueTeam::isAvailable).count());
    }
}
