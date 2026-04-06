package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.Ward;

/**
 * Ward response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WardRes(
        String code,
        String districtCode,
        String name
) {
    public static WardRes fromEntity(Ward ward) {
        return new WardRes(ward.getCode(), ward.getDistrictCode(), ward.getName());
    }
}
