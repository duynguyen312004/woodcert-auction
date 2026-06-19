ALTER TABLE order_fulfillments
    ADD COLUMN shipment_deadline DATETIME(6) NULL AFTER status;

UPDATE order_fulfillments f
JOIN orders o ON o.id = f.order_id
SET f.shipment_deadline = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 72 HOUR)
WHERE f.status = 'PENDING_SHIPMENT'
  AND o.status = 'PAID'
  AND f.shipment_deadline IS NULL;

CREATE INDEX idx_order_fulfillments_shipment_deadline
    ON order_fulfillments (status, shipment_deadline);
