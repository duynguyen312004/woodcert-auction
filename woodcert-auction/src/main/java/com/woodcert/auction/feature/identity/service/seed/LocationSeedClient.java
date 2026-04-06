package com.woodcert.auction.feature.identity.service.seed;

import java.util.List;

public interface LocationSeedClient {

    List<LocationSeedProvince> fetchLocations();

    record LocationSeedProvince(
            String code,
            String name,
            List<LocationSeedDistrict> districts
    ) {
    }

    record LocationSeedDistrict(
            String code,
            String provinceCode,
            String name,
            List<LocationSeedWard> wards
    ) {
    }

    record LocationSeedWard(
            String code,
            String districtCode,
            String name
    ) {
    }
}
