package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.District;

/**
 * District response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DistrictRes(
        String code,
        String provinceCode,
        String name
) {
    public static DistrictRes fromEntity(District district) {
        return new DistrictRes(district.getCode(), district.getProvinceCode(), district.getName());
    }
}
