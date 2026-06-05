package com.woodcert.auction.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationIntegrationTest {

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
                assertThat(queryLong(connection, """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'orders'
                          AND column_name = 'version'
                        """)).isEqualTo(1L);
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
}
