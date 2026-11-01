package com.crisissync.config;

import com.crisissync.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Preflight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 2. Public Static Assets & Documentation
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/frontend/**",
                                "/style.css",
                                "/api.js",
                                "/app.js",
                                "/*.html",
                                "/*.css",
                                "/*.js",
                                "/*.png",
                                "/*.ico",
                                "/*.svg"
                        ).permitAll()
                        // 3. Public Auth & Health probes
                        .requestMatchers("/api/auth/signin", "/api/auth/signup", "/api/auth/reset-admin", "/api/auth/init-admin", "/api/health", "/error").permitAll()
                        // 4. Admin-only endpoints
                        .requestMatchers("/api/admin/**", "/api/auth/admin-provision").hasRole("ADMIN")
                        // 5. Public Emergency Incident Reporting (accessible to all authenticated citizens, coordinators, admins)
                        .requestMatchers(HttpMethod.POST, "/api/regions/public-report", "/api/regions/report").authenticated()
                        // 6. Coordinator-only manual region provisioning & updates
                        .requestMatchers(HttpMethod.POST, "/api/regions", "/api/regions/").hasAnyRole("ADMIN", "COORDINATOR")
                        .requestMatchers(HttpMethod.PUT, "/api/regions/**").hasAnyRole("ADMIN", "COORDINATOR")
                        // 6. Other operational mutations require COORDINATOR or ADMIN clearance
                        .requestMatchers(HttpMethod.POST, "/api/inventory/**",
                                "/api/rescue-teams/**", "/api/shelters/**", "/api/roads/**", "/api/requests/**", "/api/allocation/**")
                        .hasAnyRole("ADMIN", "COORDINATOR")
                        .requestMatchers(HttpMethod.PUT, "/api/rescue-teams/**", "/api/roads/**",
                                "/api/shelters/**", "/api/inventory/**")
                        .hasAnyRole("ADMIN", "COORDINATOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**", "/api/rescue-teams/**",
                                "/api/shelters/**", "/api/roads/**", "/api/requests/**")
                        .hasAnyRole("ADMIN", "COORDINATOR")
                        // 6. Read-only endpoints accessible to all authenticated roles (including PUBLIC observers)
                        .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://[::1]:*",
                "http://localhost",
                "http://127.0.0.1",
                "http://[::1]",
                "null"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
