package com.crisissync.repository;

import com.crisissync.entity.ReliefRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReliefRequestRepository extends JpaRepository<ReliefRequestEntity, Integer> {
    List<ReliefRequestEntity> findByStatus(String status);
}
