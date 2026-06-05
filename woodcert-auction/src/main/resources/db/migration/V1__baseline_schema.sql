-- Baseline schema generated from the current JPA model.
-- Fresh environments run this before Hibernate validates mappings.

CREATE TABLE IF NOT EXISTS permissions (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_permissions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id VARCHAR(100),
    public_id VARCHAR(255),
    resource_type VARCHAR(20) NOT NULL,
    usage_type VARCHAR(40) NOT NULL,
    owner_user_id VARCHAR(36) NOT NULL,
    folder VARCHAR(255) NOT NULL,
    asset_version BIGINT,
    format VARCHAR(20),
    file_size BIGINT,
    width INT,
    height INT,
    duration_seconds DOUBLE,
    content_type VARCHAR(100),
    original_filename VARCHAR(255),
    secure_url VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    metadata_json TEXT,
    delete_requested_at DATETIME(6),
    deleted_at DATETIME(6),
    cleanup_attempts INT NOT NULL,
    last_error VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_media_assets_asset_id (asset_id),
    UNIQUE KEY uk_media_assets_public_id (public_id),
    KEY idx_media_assets_owner_usage (owner_user_id, usage_type),
    KEY idx_media_assets_status_created (status, created_at),
    KEY idx_media_assets_status_delete_requested (status, delete_requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    avatar_media_id BIGINT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_users_email (email),
    UNIQUE KEY idx_users_phone_number (phone_number),
    KEY idx_users_avatar_media_id (avatar_media_id),
    CONSTRAINT fk_users_avatar_media FOREIGN KEY (avatar_media_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provinces (
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
    code VARCHAR(20) NOT NULL,
    province_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (code),
    KEY idx_districts_province_code (province_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wards (
    code VARCHAR(20) NOT NULL,
    district_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (code),
    KEY idx_wards_district_code (district_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    province_code VARCHAR(20),
    district_code VARCHAR(20),
    ward_code VARCHAR(20),
    is_default BIT(1) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_addresses_user_id (user_id),
    KEY idx_addresses_province_code (province_code),
    KEY idx_addresses_district_code (district_code),
    KEY idx_addresses_ward_code (ward_code),
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seller_profiles (
    user_id VARCHAR(36) NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    identity_card_number VARCHAR(20) NOT NULL,
    tax_code VARCHAR(50),
    reputation_score DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_seller_profiles_identity_card_number (identity_card_number),
    CONSTRAINT fk_seller_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token CHAR(64) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BIT(1) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_refresh_tokens_token (token),
    KEY idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token_hash CHAR(64) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_email_verification_tokens_token_hash (token_hash),
    KEY idx_email_verification_tokens_user_id (user_id),
    CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token_hash CHAR(64) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_password_reset_tokens_token_hash (token_hash),
    KEY idx_password_reset_tokens_user_id (user_id),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    parent_id INT,
    description VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_name (name),
    UNIQUE KEY uk_categories_slug (slug),
    KEY idx_categories_parent_id (parent_id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    seller_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    material VARCHAR(100),
    dimensions VARCHAR(100),
    weight DECIMAL(10,2),
    status VARCHAR(30) NOT NULL,
    sale_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    submitted_at DATETIME(6),
    appraisal_claimed_by VARCHAR(36),
    appraisal_claimed_at DATETIME(6),
    appraisal_claim_expires_at DATETIME(6),
    rejected_reason TEXT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_products_seller_id (seller_id),
    KEY idx_products_category_id (category_id),
    KEY idx_products_status (status),
    KEY idx_products_sale_status (sale_status),
    CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    media_id BIGINT NOT NULL,
    is_primary BIT(1) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_product_images_product_id (product_id),
    KEY idx_product_images_media_id (media_id),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_product_images_media FOREIGN KEY (media_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appraisal_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    appraiser_id VARCHAR(36) NOT NULL,
    certificate_code VARCHAR(50) NOT NULL,
    verified_material VARCHAR(100) NOT NULL,
    origin VARCHAR(100),
    age_estimation VARCHAR(50),
    condition_grade VARCHAR(20),
    estimated_value DECIMAL(19,2) NOT NULL,
    is_authentic BIT(1) NOT NULL,
    appraiser_notes TEXT,
    seller_accuracy DECIMAL(3,2) NOT NULL,
    digital_signature VARCHAR(255) NOT NULL,
    appraised_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_appraisal_reports_product_id (product_id),
    UNIQUE KEY uk_appraisal_reports_certificate_code (certificate_code),
    KEY idx_appraisal_reports_appraiser_id (appraiser_id),
    KEY idx_appraisal_reports_verified_material (verified_material),
    KEY idx_appraisal_reports_origin (origin),
    KEY idx_appraisal_reports_condition_grade (condition_grade),
    KEY idx_appraisal_reports_estimated_value (estimated_value),
    CONSTRAINT fk_appraisal_reports_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_appraisal_reports_appraiser FOREIGN KEY (appraiser_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appraisal_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    appraisal_report_id BIGINT NOT NULL,
    media_id BIGINT NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_appraisal_images_report_id (appraisal_report_id),
    KEY idx_appraisal_images_media_id (media_id),
    CONSTRAINT fk_appraisal_images_report FOREIGN KEY (appraisal_report_id) REFERENCES appraisal_reports (id),
    CONSTRAINT fk_appraisal_images_media FOREIGN KEY (media_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    available_balance DECIMAL(19,2) NOT NULL,
    frozen_balance DECIMAL(19,2) NOT NULL,
    version INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_wallets_user_id (user_id),
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_wallet_transactions_wallet_id (wallet_id),
    KEY idx_wallet_transactions_created_at (created_at),
    KEY idx_wallet_transactions_reference (reference_type, reference_id),
    CONSTRAINT fk_wallet_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES wallets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_operations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    operation_key VARCHAR(200) NOT NULL,
    wallet_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    failure_code VARCHAR(100),
    failure_message VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_wallet_operations_operation_key (operation_key),
    KEY idx_wallet_operations_wallet_id (wallet_id),
    CONSTRAINT fk_wallet_operations_wallet FOREIGN KEY (wallet_id) REFERENCES wallets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vnpay_deposits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    txn_ref VARCHAR(100) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    order_info VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    vnp_transaction_no VARCHAR(100),
    vnp_response_code VARCHAR(10),
    vnp_bank_code VARCHAR(50),
    created_at DATETIME(6) NOT NULL,
    paid_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY idx_vnpay_deposits_txn_ref (txn_ref),
    KEY idx_vnpay_deposits_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_revenue_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type VARCHAR(40) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    source_user_id VARCHAR(36),
    reference_type VARCHAR(40) NOT NULL,
    reference_id BIGINT,
    operation_key VARCHAR(160) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_platform_revenue_operation_key (operation_key),
    KEY idx_platform_revenue_type (type),
    KEY idx_platform_revenue_reference (reference_type, reference_id),
    KEY idx_platform_revenue_source_user (source_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    starting_price DECIMAL(19,2) NOT NULL,
    reserve_price DECIMAL(19,2) NOT NULL,
    step_price DECIMAL(19,2) NOT NULL,
    deposit_amount DECIMAL(19,2) NOT NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    current_price DECIMAL(19,2),
    highest_bidder_id VARCHAR(36),
    winner_bid_id BIGINT,
    status VARCHAR(20) NOT NULL,
    version INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_auction_sessions_product_id (product_id),
    KEY idx_auction_sessions_status (status),
    KEY idx_auction_sessions_end_time (end_time),
    KEY idx_auction_sessions_status_end_time (status, end_time),
    CONSTRAINT fk_auction_sessions_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_participants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    auction_session_id BIGINT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    deposit_amount DECIMAL(19,2) NOT NULL,
    deposit_status VARCHAR(20) NOT NULL,
    registered_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_auction_participants_user_session (auction_session_id, user_id),
    KEY idx_auction_participants_session_id (auction_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bids (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bid_trace_id VARCHAR(36) NOT NULL,
    auction_session_id BIGINT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    bid_amount DECIMAL(19,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    bid_time DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bids_bid_trace_id (bid_trace_id),
    KEY idx_bids_auction_session_bid_time (auction_session_id, bid_time),
    KEY idx_bids_auction_session_bid_amount (auction_session_id, bid_amount),
    KEY idx_bids_bid_time (bid_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    source_type VARCHAR(30) NOT NULL,
    source_id BIGINT NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    product_id BIGINT NOT NULL,
    final_price DECIMAL(19,2) NOT NULL,
    deposit_amount DECIMAL(19,2) NOT NULL,
    remaining_amount DECIMAL(19,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_deadline DATETIME(6),
    paid_at DATETIME(6),
    completed_at DATETIME(6),
    canceled_at DATETIME(6),
    cancel_reason VARCHAR(255),
    platform_commission_rate DECIMAL(5,4),
    platform_commission_amount DECIMAL(19,2),
    seller_payout_amount DECIMAL(19,2),
    forfeited_deposit_platform_fee_amount DECIMAL(19,2),
    forfeited_deposit_seller_amount DECIMAL(19,2),
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_source (source_type, source_id),
    KEY idx_orders_buyer (buyer_id),
    KEY idx_orders_seller (seller_id),
    KEY idx_orders_status (status),
    KEY idx_orders_payment_deadline (payment_deadline),
    KEY idx_orders_product_id (product_id),
    CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_fulfillments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL,
    tracking_code VARCHAR(120),
    shipped_at DATETIME(6),
    received_at DATETIME(6),
    auto_complete_deadline DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_fulfillments_order (order_id),
    KEY idx_order_fulfillments_seller (seller_id),
    KEY idx_order_fulfillments_buyer (buyer_id),
    KEY idx_order_fulfillments_status (status),
    KEY idx_order_fulfillments_auto_deadline (auto_complete_deadline),
    CONSTRAINT fk_order_fulfillments_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_cases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    fulfillment_id BIGINT,
    opened_by_user_id VARCHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL,
    reason VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    opened_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6),
    resolved_by_admin_id VARCHAR(36),
    resolution_outcome VARCHAR(30),
    resolution_note VARCHAR(2000),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_dispute_cases_order (order_id),
    KEY idx_dispute_cases_fulfillment (fulfillment_id),
    KEY idx_dispute_cases_status (status),
    KEY idx_dispute_cases_opened_by (opened_by_user_id),
    CONSTRAINT fk_dispute_cases_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_dispute_cases_fulfillment FOREIGN KEY (fulfillment_id) REFERENCES order_fulfillments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_evidence (
    id BIGINT NOT NULL AUTO_INCREMENT,
    dispute_case_id BIGINT NOT NULL,
    media_id BIGINT NOT NULL,
    uploaded_by_user_id VARCHAR(36) NOT NULL,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_dispute_evidence_case (dispute_case_id),
    KEY idx_dispute_evidence_media (media_id),
    KEY idx_dispute_evidence_uploaded_by (uploaded_by_user_id),
    CONSTRAINT fk_dispute_evidence_case FOREIGN KEY (dispute_case_id) REFERENCES dispute_cases (id),
    CONSTRAINT fk_dispute_evidence_media FOREIGN KEY (media_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
