package com.woodcert.auction.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductionRuntimeConfigurationIntegrationTest {

    private static final String ADMIN_HASH =
            "$2a$10$2b2YJQW1UVEQBDaXxzN6XuVEZNMqyPQHhA/JU5UhdWkNAU9gUkJXq";
    private static final String APPRAISER_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoO5S.Cn6QHdfD4xR7XqxM8aM5.tS2IY6K";
    private static final String REDIS_PASSWORD = "production-wiring-redis-password";

    @Container
    @SuppressWarnings("resource")
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("woodcert_production_wiring_test")
            .withUsername("woodcert")
            .withPassword("woodcert");

    @Container
    @SuppressWarnings("resource")
    private static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
                    .withExposedPorts(6379)
                    .withCommand("redis-server", "--appendonly", "no", "--requirepass", REDIS_PASSWORD);

    @DynamicPropertySource
    static void registerProductionProperties(DynamicPropertyRegistry registry) {
        registry.add("DB_URL", MYSQL::getJdbcUrl);
        registry.add("DB_USERNAME", MYSQL::getUsername);
        registry.add("DB_PASSWORD", MYSQL::getPassword);
        registry.add("REDIS_HOST", REDIS::getHost);
        registry.add("REDIS_PORT", () -> REDIS.getMappedPort(6379));
        registry.add("REDIS_PASSWORD", () -> REDIS_PASSWORD);
        registry.add("ADMIN_PASSWORD_HASH", () -> ADMIN_HASH);
        registry.add("APPRAISER_PASSWORD_HASH", () -> APPRAISER_HASH);
        registry.add("JWT_SECRET_KEY",
                () -> "production-wiring-jwt-secret-at-least-64-characters-long-0123456789");
        registry.add("identity.location-seed.enabled", () -> "false");
        registry.add("identity.refresh-token-cleanup.enabled", () -> "false");
        registry.add("cloudinary.cleanup.enabled", () -> "false");
        registry.add("auction.scheduler.enabled", () -> "false");
        registry.add("order.scheduler-enabled", () -> "false");
        registry.add("fulfillment.scheduler-enabled", () -> "false");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void productionEnvironmentAppliesFlywayPlaceholdersAndRedisAuthentication() {
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1",
                Integer.class)).isEqualTo(5);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '5' AND success = 1",
                Integer.class)).isEqualTo(1);
        assertThat(passwordHashFor("admin@woodcert.local")).isEqualTo(ADMIN_HASH);
        assertThat(passwordHashFor("appraiser@woodcert.local")).isEqualTo(APPRAISER_HASH);

        redisTemplate.opsForValue().set("production-wiring:test", "ok");
        assertThat(redisTemplate.opsForValue().get("production-wiring:test")).isEqualTo("ok");
        redisTemplate.delete("production-wiring:test");

        var response = restTemplate.getForEntity(
                "http://127.0.0.1:" + port + "/actuator/health/readiness",
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().path("status").asText()).isEqualTo("UP");
    }

    private String passwordHashFor(String email) {
        return jdbcTemplate.queryForObject(
                "SELECT password_hash FROM users WHERE email = ?",
                String.class,
                email);
    }
}
