package com.woodcert.auction.feature.identity.service;

public record BuyerOrderProfileSnapshot(
        String id,
        String fullName,
        String phoneNumber,
        String email
) {
}
