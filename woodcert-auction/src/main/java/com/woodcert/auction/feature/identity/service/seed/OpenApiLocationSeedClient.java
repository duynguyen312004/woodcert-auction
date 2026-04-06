package com.woodcert.auction.feature.identity.service.seed;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenApiLocationSeedClient implements LocationSeedClient {

    private final LocationSeedProperties properties;

    @Override
    public List<LocationSeedProvince> fetchLocations() {
        RestClient restClient = RestClient.create();
        OpenApiProvince[] response = restClient.get()
                .uri(properties.apiUrl())
                .retrieve()
                .body(OpenApiProvince[].class);

        if (response == null) {
            return List.of();
        }

        return Arrays.stream(response)
                .map(this::toProvince)
                .toList();
    }

    private LocationSeedProvince toProvince(OpenApiProvince province) {
        List<LocationSeedDistrict> districts = province.districts() == null
                ? List.of()
                : province.districts().stream().map(this::toDistrict).toList();

        return new LocationSeedProvince(
                normalizeProvinceCode(province.code()),
                normalizeName(province.name()),
                districts
        );
    }

    private LocationSeedDistrict toDistrict(OpenApiDistrict district) {
        List<LocationSeedWard> wards = district.wards() == null
                ? List.of()
                : district.wards().stream().map(this::toWard).toList();

        return new LocationSeedDistrict(
                normalizeDistrictCode(district.code()),
                normalizeProvinceCode(district.provinceCode()),
                normalizeName(district.name()),
                wards
        );
    }

    private LocationSeedWard toWard(OpenApiWard ward) {
        return new LocationSeedWard(
                normalizeWardCode(ward.code()),
                normalizeDistrictCode(ward.districtCode()),
                normalizeName(ward.name())
        );
    }

    private String normalizeProvinceCode(Integer code) {
        return String.format("%02d", code);
    }

    private String normalizeDistrictCode(Integer code) {
        return String.format("%03d", code);
    }

    private String normalizeWardCode(Integer code) {
        return String.format("%05d", code);
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }

    private record OpenApiProvince(
            Integer code,
            String name,
            List<OpenApiDistrict> districts
    ) {
    }

    private record OpenApiDistrict(
            Integer code,
            String name,
            Integer province_code,
            List<OpenApiWard> wards
    ) {
        Integer provinceCode() {
            return province_code;
        }
    }

    private record OpenApiWard(
            Integer code,
            String name,
            Integer district_code
    ) {
        Integer districtCode() {
            return district_code;
        }
    }
}
