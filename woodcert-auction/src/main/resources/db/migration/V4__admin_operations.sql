-- Admin operations hardening: capability bans, audit logs, and explicit auction registration permission.

CREATE TABLE IF NOT EXISTS user_capability_statuses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    capability VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(1000),
    updated_by_admin_id VARCHAR(36),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_capability_statuses_user_capability (user_id, capability),
    KEY idx_user_capability_statuses_user (user_id),
    KEY idx_user_capability_statuses_status (status),
    CONSTRAINT fk_user_capability_statuses_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_capability_statuses_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(80) NOT NULL,
    reason VARCHAR(1000),
    metadata TEXT,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_admin_audit_logs_actor (actor_admin_id),
    KEY idx_admin_audit_logs_action (action),
    KEY idx_admin_audit_logs_target (target_type, target_id),
    KEY idx_admin_audit_logs_created (created_at),
    CONSTRAINT fk_admin_audit_logs_actor FOREIGN KEY (actor_admin_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (name, description)
VALUES ('REGISTER_AUCTION', 'Register for an auction session and freeze deposit')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'REGISTER_AUCTION'
WHERE r.name = 'ROLE_BIDDER'
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    permission_id = VALUES(permission_id);
