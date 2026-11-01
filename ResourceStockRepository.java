package com.crisissync.repository;

import com.crisissync.entity.ResourceStockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceStockRepository extends JpaRepository<ResourceStockEntity, Integer> {
}
