package com.woodcert.auction.feature.identity.service;

public interface ShippingAddressQueryService {

    ShippingAddressSnapshot getOwnedAddressSnapshot(String userId, Long addressId);
}
