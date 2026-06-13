-- Operator accounts for fresh environments.
-- Password hashes are supplied through Flyway placeholders.

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone_number,
    status,
    avatar_media_id,
    created_at,
    updated_at
) VALUES
    (
        '00000000-0000-0000-0000-000000000401',
        'admin@woodcert.local',
        '${adminPasswordHash}',
        'WoodCert Admin',
        '0900000401',
        'ACTIVE',
        NULL,
        NOW(6),
        NOW(6)
    ),
    (
        '00000000-0000-0000-0000-000000000301',
        'appraiser@woodcert.local',
        '${appraiserPasswordHash}',
        'WoodCert Appraiser',
        '0900000301',
        'ACTIVE',
        NULL,
        NOW(6),
        NOW(6)
    )
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    phone_number = VALUES(phone_number),
    status = VALUES(status),
    updated_at = VALUES(updated_at);

INSERT INTO user_roles (user_id, role_id) VALUES
    ('00000000-0000-0000-0000-000000000401', 4),
    ('00000000-0000-0000-0000-000000000301', 3)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    role_id = VALUES(role_id);
