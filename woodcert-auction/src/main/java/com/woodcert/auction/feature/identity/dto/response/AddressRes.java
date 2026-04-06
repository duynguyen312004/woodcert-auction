package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.Address;

/**
 * Shipping address response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AddressRes(
        Long id,
        String receiverName,
        String phoneNumber,
        String streetAddress,
        String provinceCode,
        String districtCode,
        String wardCode,
        boolean isDefault
) {
    public static AddressRes fromEntity(Address address) {
        return new AddressRes(
                address.getId(),
                address.getReceiverName(),
                address.getPhoneNumber(),
                address.getStreetAddress(),
                address.getProvinceCode(),
                address.getDistrictCode(),
                address.getWardCode(),
                address.isDefault()
        );
    }
}
