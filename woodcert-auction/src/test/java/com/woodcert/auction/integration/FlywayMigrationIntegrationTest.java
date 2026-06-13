package com.woodcert.auction.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;

import java.sql.DriverManager;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationIntegrationTest {

    private static final String ADMIN_HASH =
            "$2a$10$2b2YJQW1UVEQBDaXxzN6XuVEZNMqyPQHhA/JU5UhdWkNAU9gUkJXq";
    private static final String APPRAISER_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoO5S.Cn6QHdfD4xR7XqxM8aM5.tS2IY6K";

    @Test
    @SuppressWarnings("resource")
    void migrationsApplyAndSeedReferenceDataOnFreshMysql() throws Exception {
        MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
                .withDatabaseName("woodcert_flyway_test")
                .withUsername("woodcert")
                .withPassword("woodcert");
        try (mysql) {
            mysql.start();

            Flyway flyway = Flyway.configure()
                    .dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword())
                    .locations("classpath:db/migration")
                    .placeholders(Map.of(
                            "adminPasswordHash", ADMIN_HASH,
                            "appraiserPasswordHash", APPRAISER_HASH))
                    .load();

            flyway.migrate();

            try (var connection = DriverManager.getConnection(
                    mysql.getJdbcUrl(),
                    mysql.getUsername(),
                    mysql.getPassword()
            )) {
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM categories WHERE parent_id IS NULL"))
                        .isGreaterThanOrEqualTo(10L);
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM categories WHERE slug = 'khac'"))
                        .isEqualTo(1L);
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM permissions WHERE name = 'ADMIN_ACCESS'"))
                        .isEqualTo(1L);
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM permissions WHERE name = 'MANAGE_CATEGORIES'"))
                        .isEqualTo(1L);
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM permissions WHERE name = 'REGISTER_AUCTION'"))
                        .isEqualTo(1L);
                assertThat(queryLong(connection, "SELECT COUNT(*) FROM permissions WHERE name = 'JOIN_AUCTION'"))
                        .isZero();
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'orders'
                          AND column_name = 'version'
                        """)).isEqualTo(1L);
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'orders'
                          AND column_name IN ('product_title', 'buyer_refund_amount', 'refunded_at')
                        """)).isEqualTo(3L);
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = DATABASE()
                          AND table_name IN ('user_capability_statuses', 'admin_audit_logs')
                        """)).isEqualTo(2L);
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM users u
                        JOIN user_roles ur ON ur.user_id = u.id
                        JOIN roles r ON r.id = ur.role_id
                        WHERE u.email = 'admin@woodcert.local'
                          AND u.status = 'ACTIVE'
                          AND r.name = 'ROLE_ADMIN'
                        """)).isEqualTo(1L);
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM users u
                        JOIN user_roles ur ON ur.user_id = u.id
                        JOIN roles r ON r.id = ur.role_id
                        WHERE u.email = 'appraiser@woodcert.local'
                          AND u.status = 'ACTIVE'
                          AND r.name = 'ROLE_APPRAISER'
                        """)).isEqualTo(1L);
                assertThat(queryString(connection,
                        "SELECT password_hash FROM users WHERE email = 'admin@woodcert.local'"))
                        .isEqualTo(ADMIN_HASH);
                assertThat(queryString(connection,
                        "SELECT password_hash FROM users WHERE email = 'appraiser@woodcert.local'"))
                        .isEqualTo(APPRAISER_HASH);
            }
        }
    }

    private long queryLong(java.sql.Connection connection, String sql) throws Exception {
        try (var statement = connection.createStatement();
             var resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private String queryString(java.sql.Connection connection, String sql) throws Exception {
        try (var statement = connection.createStatement();
             var resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getString(1);
        }
    }
}
