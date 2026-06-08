package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderEntity;

public record OrderShippingAddressRes(
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
    public static OrderShippingAddressRes fromEntity(OrderEntity order) {
        if (order.getShippingReceiverName() == null) {
            return null;
        }
        return new OrderShippingAddressRes(
                order.getShippingReceiverName(),
                order.getShippingPhoneNumber(),
                order.getShippingStreetAddress(),
                order.getShippingWardCode(),
                order.getShippingWardName(),
                order.getShippingDistrictCode(),
                order.getShippingDistrictName(),
                order.getShippingProvinceCode(),
                order.getShippingProvinceName()
        );
    }
}
