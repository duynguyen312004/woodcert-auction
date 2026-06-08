ALTER TABLE orders
    ADD COLUMN product_title VARCHAR(255) NULL AFTER product_id,
    ADD COLUMN product_image_url VARCHAR(1000) NULL AFTER product_title,
    ADD COLUMN shipping_receiver_name VARCHAR(100) NULL AFTER forfeited_deposit_seller_amount,
    ADD COLUMN shipping_phone_number VARCHAR(20) NULL AFTER shipping_receiver_name,
    ADD COLUMN shipping_street_address VARCHAR(255) NULL AFTER shipping_phone_number,
    ADD COLUMN shipping_ward_code VARCHAR(20) NULL AFTER shipping_street_address,
    ADD COLUMN shipping_ward_name VARCHAR(100) NULL AFTER shipping_ward_code,
    ADD COLUMN shipping_district_code VARCHAR(20) NULL AFTER shipping_ward_name,
    ADD COLUMN shipping_district_name VARCHAR(100) NULL AFTER shipping_district_code,
    ADD COLUMN shipping_province_code VARCHAR(20) NULL AFTER shipping_district_name,
    ADD COLUMN shipping_province_name VARCHAR(100) NULL AFTER shipping_province_code;

UPDATE orders o
JOIN products p ON p.id = o.product_id
SET o.product_title = p.title
WHERE o.product_title IS NULL;
