CREATE TABLE IF NOT EXISTS dispute_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    dispute_case_id BIGINT NOT NULL,
    author_user_id VARCHAR(36) NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    content VARCHAR(2000),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_dispute_messages_case_created (dispute_case_id, created_at, id),
    KEY idx_dispute_messages_author (author_user_id),
    CONSTRAINT fk_dispute_messages_case
        FOREIGN KEY (dispute_case_id) REFERENCES dispute_cases (id),
    CONSTRAINT fk_dispute_messages_author
        FOREIGN KEY (author_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE dispute_evidence
    ADD COLUMN message_id BIGINT NULL AFTER dispute_case_id,
    ADD KEY idx_dispute_evidence_message (message_id),
    ADD CONSTRAINT fk_dispute_evidence_message
        FOREIGN KEY (message_id) REFERENCES dispute_messages (id);
