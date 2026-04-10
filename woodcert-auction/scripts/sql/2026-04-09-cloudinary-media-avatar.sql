CREATE TABLE media_assets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id VARCHAR(100) NULL,
    public_id VARCHAR(255) NULL,
    resource_type VARCHAR(20) NOT NULL,
    usage_type VARCHAR(40) NOT NULL,
    owner_user_id VARCHAR(36) NOT NULL,
    folder VARCHAR(255) NOT NULL,
    asset_version BIGINT NULL,
    format VARCHAR(20) NULL,
    file_size BIGINT NULL,
    width INT NULL,
    height INT NULL,
    duration_seconds DOUBLE NULL,
    content_type VARCHAR(100) NULL,
    original_filename VARCHAR(255) NULL,
    secure_url VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL,
    metadata_json TEXT NULL,
    delete_requested_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    cleanup_attempts INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_media_assets_asset_id (asset_id),
    UNIQUE KEY uk_media_assets_public_id (public_id),
    KEY idx_media_assets_owner_usage (owner_user_id, usage_type),
    KEY idx_media_assets_status_created (status, created_at),
    KEY idx_media_assets_status_delete_requested (status, delete_requested_at)
);

ALTER TABLE users
    ADD COLUMN avatar_media_id BIGINT NULL,
    ADD CONSTRAINT fk_users_avatar_media
        FOREIGN KEY (avatar_media_id) REFERENCES media_assets(id);

ALTER TABLE users
    DROP COLUMN avatar_url;
