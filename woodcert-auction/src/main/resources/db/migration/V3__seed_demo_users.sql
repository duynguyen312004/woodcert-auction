-- Demo operator accounts for local reset/demo environments.
-- Password for both accounts: Demo@123456

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
        '$2a$10$MNMXWLbkwtd08FJDQZDH7eu6xy0x.ecuL47Llg4li/EVtAlMOe3dC',
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
        '$2a$10$MNMXWLbkwtd08FJDQZDH7eu6xy0x.ecuL47Llg4li/EVtAlMOe3dC',
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
