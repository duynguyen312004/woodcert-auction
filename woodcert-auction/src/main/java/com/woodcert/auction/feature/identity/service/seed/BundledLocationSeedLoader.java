package com.woodcert.auction.feature.identity.service.seed;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BundledLocationSeedLoader {

    private static final String BUNDLED_RESOURCE_PATH = "seed/location-seed.json";

    private final ObjectMapper objectMapper;

    public List<LocationSeedClient.LocationSeedProvince> loadLocations() {
        ClassPathResource resource = new ClassPathResource(BUNDLED_RESOURCE_PATH);
        if (!resource.exists()) {
            return List.of();
        }

        try (InputStream inputStream = resource.getInputStream()) {
            BundledProvince[] response = objectMapper.readValue(
                    inputStream,
                    BundledProvince[].class
            );
            if (response == null) {
                return List.of();
            }

            return java.util.Arrays.stream(response)
                    .map(this::toProvince)
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read bundled Vietnam location seed", e);
        }
    }

    private LocationSeedClient.LocationSeedProvince toProvince(BundledProvince province) {
        List<LocationSeedClient.LocationSeedDistrict> districts = province.districts() == null
                ? List.of()
                : province.districts().stream().map(this::toDistrict).toList();

        return new LocationSeedClient.LocationSeedProvince(
                normalizeProvinceCode(province.code()),
                normalizeName(province.name()),
                districts
        );
    }

    private LocationSeedClient.LocationSeedDistrict toDistrict(BundledDistrict district) {
        List<LocationSeedClient.LocationSeedWard> wards = district.wards() == null
                ? List.of()
                : district.wards().stream().map(this::toWard).toList();

        return new LocationSeedClient.LocationSeedDistrict(
                normalizeDistrictCode(district.code()),
                normalizeProvinceCode(district.provinceCode()),
                normalizeName(district.name()),
                wards
        );
    }

    private LocationSeedClient.LocationSeedWard toWard(BundledWard ward) {
        return new LocationSeedClient.LocationSeedWard(
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

    private record BundledProvince(
            Integer code,
            String name,
            List<BundledDistrict> districts
    ) {
    }

    private record BundledDistrict(
            Integer code,
            String name,
            @JsonProperty("province_code") Integer provinceCode,
            List<BundledWard> wards
    ) {
    }

    private record BundledWard(
            Integer code,
            String name,
            @JsonProperty("district_code") Integer districtCode
    ) {
    }
}
