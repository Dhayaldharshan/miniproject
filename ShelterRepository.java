package com.crisissync.repository;

import com.crisissync.entity.ShelterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShelterRepository extends JpaRepository<ShelterEntity, Integer> {
    Optional<ShelterEntity> findByShelterName(String shelterName);
}
