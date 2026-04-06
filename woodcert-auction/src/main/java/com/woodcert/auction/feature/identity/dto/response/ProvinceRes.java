package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.Province;

/**
 * Province response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProvinceRes(
        String code,
        String name
) {
    public static ProvinceRes fromEntity(Province province) {
        return new ProvinceRes(province.getCode(), province.getName());
    }
}
