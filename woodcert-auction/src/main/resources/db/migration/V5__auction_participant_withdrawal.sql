ALTER TABLE auction_participants
    ADD COLUMN withdrawn_at DATETIME(6) NULL AFTER registered_at;
