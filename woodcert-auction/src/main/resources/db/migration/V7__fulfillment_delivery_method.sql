ALTER TABLE order_fulfillments
    ADD COLUMN delivery_method VARCHAR(30) NULL AFTER status,
    ADD COLUMN carrier_name VARCHAR(120) NULL AFTER delivery_method;
