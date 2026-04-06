package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.response.DistrictRes;
import com.woodcert.auction.feature.identity.dto.response.ProvinceRes;
import com.woodcert.auction.feature.identity.dto.response.WardRes;
import com.woodcert.auction.feature.identity.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<ProvinceRes>>> getProvinces() {
        List<ProvinceRes> provinces = locationService.getProvinces();
        return ResponseEntity.ok(ApiResponse.success(provinces, "Fetch provinces successful"));
    }

    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<DistrictRes>>> getDistricts(
            @RequestParam String provinceCode) {
        List<DistrictRes> districts = locationService.getDistricts(provinceCode);
        return ResponseEntity.ok(ApiResponse.success(districts, "Fetch districts successful"));
    }

    @GetMapping("/wards")
    public ResponseEntity<ApiResponse<List<WardRes>>> getWards(
            @RequestParam String districtCode) {
        List<WardRes> wards = locationService.getWards(districtCode);
        return ResponseEntity.ok(ApiResponse.success(wards, "Fetch wards successful"));
    }
}
