package com.crisissync.repository;

import com.crisissync.entity.AffectedRegionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AffectedRegionRepository extends JpaRepository<AffectedRegionEntity, Integer> {
    Optional<AffectedRegionEntity> findByRegionName(String regionName);
}
