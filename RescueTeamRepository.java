package com.crisissync.repository;

import com.crisissync.entity.RescueTeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RescueTeamRepository extends JpaRepository<RescueTeamEntity, Integer> {
    List<RescueTeamEntity> findByAvailable(boolean available);
}
