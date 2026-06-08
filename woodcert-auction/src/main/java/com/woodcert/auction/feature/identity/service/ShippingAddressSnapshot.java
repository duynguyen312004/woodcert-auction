package com.woodcert.auction.feature.identity.service;

public record ShippingAddressSnapshot(
        String receiverName,
        String phoneNumber,
        String streetAddress,
        String wardCode,
        String wardName,
        String districtCode,
        String districtName,
        String provinceCode,
        String provinceName
) {
}
