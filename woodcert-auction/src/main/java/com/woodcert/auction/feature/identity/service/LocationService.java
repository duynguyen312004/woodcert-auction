package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.response.DistrictRes;
import com.woodcert.auction.feature.identity.dto.response.ProvinceRes;
import com.woodcert.auction.feature.identity.dto.response.WardRes;

import java.util.List;

public interface LocationService {

    List<ProvinceRes> getProvinces();

    List<DistrictRes> getDistricts(String provinceCode);

    List<WardRes> getWards(String districtCode);
}
