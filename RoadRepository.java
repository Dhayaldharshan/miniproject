package com.crisissync.repository;

import com.crisissync.entity.RoadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoadRepository extends JpaRepository<RoadEntity, Long> {
    Optional<RoadEntity> findBySourceAndDestination(String source, String destination);
    java.util.List<RoadEntity> findBySourceIgnoreCaseAndDestinationIgnoreCase(String source, String destination);
}
