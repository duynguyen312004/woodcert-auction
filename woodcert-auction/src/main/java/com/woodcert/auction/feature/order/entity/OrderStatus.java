package com.woodcert.auction.feature.order.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    FULFILLING,
    COMPLETED,
    CANCELED,
    DISPUTED
}
