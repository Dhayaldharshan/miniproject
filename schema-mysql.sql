-- ==============================================================================
-- ResQ-Allocate — Disaster Management Resource Allocation System
-- MySQL / MariaDB Database Schema Creation & Seed Script
-- Compatible with MariaDB 10.4+ and MySQL 8.0+
-- Target Database: resq_allocate
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `resq_allocate`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `resq_allocate`;

-- 1. Users & RBAC Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `full_name` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(32) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Admin Account (BCrypt hash for 'Admin@123')
INSERT IGNORE INTO `users` (`id`, `email`, `full_name`, `password_hash`, `role`, `created_at`)
VALUES (
    'usr-admin-01',
    'admin@crisis-sync.gov',
    'Chief Disaster Administrator',
    '$2a$10$uw.zDvDhj1Z3JaBKORRYO.j22TQngQwLKViWi2Vwcw7DWhShqF/z2',
    'ADMIN',
    NOW()
);

-- Seed Default Field Coordinator Account (BCrypt hash for 'Coordinator@123')
INSERT IGNORE INTO `users` (`id`, `email`, `full_name`, `password_hash`, `role`, `created_at`)
VALUES (
    'usr-coord-01',
    'coordinator@crisis-sync.gov',
    'Duty Operations Coordinator',
    '$2a$10$rgbFGU9rlb4hCkyGpEmGpOesuzUMgJoVLaYpsciay6j/y5n9lWPA2',
    'COORDINATOR',
    NOW()
);

-- Seed Default Public Citizen Observer Account (BCrypt hash for 'Citizen@123')
INSERT IGNORE INTO `users` (`id`, `email`, `full_name`, `password_hash`, `role`, `created_at`)
VALUES (
    'usr-public-01',
    'citizen@crisis-sync.gov',
    'Public Community Observer',
    '$2a$10$VaTqhoJYqcf/4hZSqT2UYe/bxZJoJT7OT3C0/KhNBGIh1yucD4X0C',
    'PUBLIC',
    NOW()
);

-- 2. Affected Regions Table
CREATE TABLE IF NOT EXISTS `affected_regions` (
    `region_id` INT NOT NULL PRIMARY KEY,
    `region_name` VARCHAR(100) NOT NULL UNIQUE,
    `population` INT NOT NULL,
    `severity` INT NOT NULL,
    `accessible` BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX `idx_regions_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Resource Stock Table (Central Warehouse Stock)
CREATE TABLE IF NOT EXISTS `resource_stock` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `food_kits` INT NOT NULL DEFAULT 0,
    `medicine_kits` INT NOT NULL DEFAULT 0,
    `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Rescue Teams Table
CREATE TABLE IF NOT EXISTS `rescue_teams` (
    `team_id` INT NOT NULL PRIMARY KEY,
    `team_name` VARCHAR(100) NOT NULL,
    `current_location` VARCHAR(100) NOT NULL,
    `available` BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX `idx_teams_available` (`available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Shelters Table
CREATE TABLE IF NOT EXISTS `shelters` (
    `shelter_id` INT NOT NULL PRIMARY KEY,
    `shelter_name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `capacity` INT NOT NULL,
    `occupied` INT NOT NULL DEFAULT 0,
    INDEX `idx_shelters_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Road Network Table
CREATE TABLE IF NOT EXISTS `roads` (
    `road_id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `source` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `travel_time` INT NOT NULL,
    `is_open` BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX `idx_roads_source` (`source`),
    INDEX `idx_roads_destination` (`destination`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Relief Requests Table
CREATE TABLE IF NOT EXISTS `relief_requests` (
    `request_id` INT NOT NULL PRIMARY KEY,
    `request_type` VARCHAR(32) NOT NULL,
    `region_name` VARCHAR(100) NOT NULL,
    `severity` INT NOT NULL,
    `affected_population` INT NOT NULL,
    `arrival_order` INT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'WAITING',
    `food_required` INT NOT NULL DEFAULT 0,
    `medicine_required` INT NOT NULL DEFAULT 0,
    `food_allocated` INT NOT NULL DEFAULT 0,
    `medicine_allocated` INT NOT NULL DEFAULT 0,
    `people_to_rescue` INT NOT NULL DEFAULT 0,
    `teams_required` INT NOT NULL DEFAULT 0,
    `assigned_team_id` INT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_requests_status` (`status`),
    INDEX `idx_requests_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
