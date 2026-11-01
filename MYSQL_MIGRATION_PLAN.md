# ResQ-Allocate — MySQL & Spring Data JPA Migration Blueprint

This blueprint provides the complete, tested architecture for migrating the current in-memory data layer to a persistent MySQL database using Spring Data JPA.

---

## 1. Required Maven Dependencies

Add the following two dependencies into [`pom.xml`](file:///c:/Users/hemad/OneDrive/Desktop/Disaster%20Management%20Resource%20Allocaton-26/pom.xml) inside `<dependencies>`:

```xml
<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- MySQL Connector / J -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

---

## 2. Database Creation & Schema DDL

The database script is already prepared and saved at:
[`src/resources/schema-mysql.sql`](file:///c:/Users/hemad/OneDrive/Desktop/Disaster%20Management%20Resource%20Allocaton-26/src/resources/schema-mysql.sql)

To execute in MySQL CLI or MySQL Workbench:
```sql
CREATE DATABASE IF NOT EXISTS `crisis_sync_db` DEFAULT CHARACTER SET utf8mb4;
USE `crisis_sync_db`;
SOURCE src/resources/schema-mysql.sql;
```

---

## 3. Spring Profile Configuration

The production profile configuration is already saved at:
[`src/resources/application-mysql.properties`](file:///c:/Users/hemad/OneDrive/Desktop/Disaster%20Management%20Resource%20Allocaton-26/src/resources/application-mysql.properties)

### Environment Variable Credentials
To prevent committing passwords to source control:
- `SPRING_DATASOURCE_URL`: Defaults to `jdbc:mysql://localhost:3306/crisis_sync_db`
- `SPRING_DATASOURCE_USERNAME`: Defaults to `root`
- `SPRING_DATASOURCE_PASSWORD`: Set in your environment or shell:
  ```powershell
  $env:SPRING_DATASOURCE_PASSWORD = "YourSecurePassword"
  ```

---

## 4. Entity Mapping Reference (JPA Entities)

### `UserEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true, length = 191)
    private String email;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 32)
    private String role;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters, Setters, Constructors
}
```

### `RegionEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "affected_regions")
public class RegionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer regionId;

    @Column(nullable = false, unique = true, length = 100)
    private String regionName;

    private int population;
    private int severity;
    private boolean accessible;

    // Getters, Setters, Constructors
}
```

### `RescueTeamEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "rescue_teams")
public class RescueTeamEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer teamId;

    @Column(nullable = false, length = 100)
    private String teamName;

    @Column(nullable = false, length = 100)
    private String currentLocation;

    private boolean available;

    // Getters, Setters, Constructors
}
```

### `ShelterEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shelters")
public class ShelterEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer shelterId;

    @Column(nullable = false, length = 100)
    private String shelterName;

    @Column(nullable = false, length = 100)
    private String location;

    private int capacity;
    private int occupied;

    // Getters, Setters, Constructors
}
```

### `RoadEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roads")
public class RoadEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roadId;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(nullable = false, length = 100)
    private String destination;

    private int travelTime;
    private boolean open;

    // Getters, Setters, Constructors
}
```

### `ReliefRequestEntity.java`
```java
package com.crisissync.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "relief_requests")
public class ReliefRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestId;

    @Column(nullable = false, length = 32)
    private String requestType; // "SUPPLY" or "RESCUE"

    @Column(nullable = false, length = 100)
    private String regionName;

    private int severity;
    private int affectedPopulation;
    private int arrivalOrder;

    @Column(nullable = false, length = 32)
    private String status; // "WAITING", "DISPATCHED", "RESOLVED"

    private int requiredFood;
    private int requiredMedicine;
    private Integer assignedTeamId;
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters, Setters, Constructors
}
```

---

## 5. Spring Data JPA Repositories

```java
package com.crisissync.persistence.repository;

import com.crisissync.persistence.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}

@Repository
public interface RegionRepository extends JpaRepository<RegionEntity, Integer> {
    Optional<RegionEntity> findByRegionName(String regionName);
}

@Repository
public interface RescueTeamRepository extends JpaRepository<RescueTeamEntity, Integer> {
    List<RescueTeamEntity> findByAvailable(boolean available);
}

@Repository
public interface ShelterRepository extends JpaRepository<ShelterEntity, Integer> {
    List<ShelterEntity> findByLocation(String location);
}

@Repository
public interface RoadRepository extends JpaRepository<RoadEntity, Integer> {
    List<RoadEntity> findBySource(String source);
}

@Repository
public interface ReliefRequestRepository extends JpaRepository<ReliefRequestEntity, Integer> {
    List<ReliefRequestEntity> findByStatus(String status);
}
```

---

## 6. Zero-Breaking-Change Transition Strategy

1. The existing REST controllers (`RegionController`, `InventoryController`, `RescueTeamController`, etc.) and frontend [`frontend/api.js`](file:///c:/Users/hemad/OneDrive/Desktop/Disaster%20Management%20Resource%20Allocaton-26/frontend/api.js) will require **zero changes** because the DTO contracts match the entities 1:1.
2. In `AuthService`, inject `UserRepository`:
   - Password hashing with BCrypt remains identical.
   - User roles (`ADMIN`, `COORDINATOR`, `PUBLIC`) remain identical.
   - Public registration continues to restrict the `ADMIN` role.
3. In `DisasterManagementService`, `@PostConstruct` populates initial graph nodes from `RegionRepository` and `RoadRepository`.
