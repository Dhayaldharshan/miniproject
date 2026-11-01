package data;

import model.AffectedRegion;
import model.RescueTeam;
import model.Shelter;

import java.util.ArrayList;

public class SampleData {

    public static ArrayList<AffectedRegion> createRegions() {

        ArrayList<AffectedRegion> regions = new ArrayList<>();

        regions.add(new AffectedRegion(1, "Aruvi Village", 500, 5, true));
        regions.add(new AffectedRegion(2, "Kurinji Nagar", 800, 4, true));
        regions.add(new AffectedRegion(3, "Mullai Area", 300, 3, true));
        regions.add(new AffectedRegion(4, "Marutham Town", 1000, 5, false));
        regions.add(new AffectedRegion(5, "Neithal Colony", 600, 2, true));
        regions.add(new AffectedRegion(6, "Valley Road", 450, 4, true));
        regions.add(new AffectedRegion(7, "River Side", 700, 5, false));
        regions.add(new AffectedRegion(8, "Hill View", 250, 3, true));

        return regions;
    }

    public static ArrayList<RescueTeam> createRescueTeams() {

        ArrayList<RescueTeam> teams = new ArrayList<>();

        // Depot 1
        teams.add(new RescueTeam(1, "Rescue Team A", "Depot 1"));
        teams.add(new RescueTeam(2, "Rescue Team B", "Depot 1"));

        // Depot 2
        teams.add(new RescueTeam(3, "Rescue Team C", "Depot 2"));

        return teams;
    }

    public static ArrayList<Shelter> createShelters() {

        ArrayList<Shelter> shelters = new ArrayList<>();

        shelters.add(new Shelter(
                1, "Shelter A", "Shelter Location 1", 500
        ));

        shelters.add(new Shelter(
                2, "Shelter B", "Shelter Location 2", 800
        ));

        return shelters;
    }
}