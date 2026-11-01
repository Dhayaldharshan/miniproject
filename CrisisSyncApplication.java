package com.crisissync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.crisissync.entity")
@EnableJpaRepositories(basePackages = "com.crisissync.repository")
public class CrisisSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrisisSyncApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" ResQ-Allocate Backend Service Started on Port 8080");
        System.out.println(" Ready for Emergency Operations & Authentication");
        System.out.println("=================================================");
    }
}
