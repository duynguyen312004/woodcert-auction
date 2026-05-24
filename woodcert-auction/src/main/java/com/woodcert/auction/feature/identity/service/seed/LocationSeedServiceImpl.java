package com.woodcert.auction.feature.identity.service.seed;

import com.woodcert.auction.feature.identity.entity.District;
import com.woodcert.auction.feature.identity.entity.Province;
import com.woodcert.auction.feature.identity.entity.Ward;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationSeedServiceImpl implements LocationSeedService {

    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;
    private final LocationSeedClient locationSeedClient;
    private final BundledLocationSeedLoader bundledLocationSeedLoader;
    private final LocationSeedProperties properties;

    @Override
    @Transactional
    public void seedIfEmpty() {
        // Bước 1: Dừng seed sớm nếu cấu hình đã tắt.
        if (!properties.enabled()) {
            log.info("Vietnam location seed is disabled");
            return;
        }

        // Bước 2: Nếu bảng province đã có dữ liệu thì xem như master data đã được seed.
        if (provinceRepository.count() > 0) {
            log.info("Vietnam location seed skipped because provinces table already has data");
            return;
        }

        // Bước 3: Chặn trạng thái dữ liệu lệch khi province rỗng nhưng district/ward đã có dữ liệu.
        if (districtRepository.count() > 0 || wardRepository.count() > 0) {
            throw new IllegalStateException(
                    "Location tables are inconsistent: provinces is empty but districts or wards already contain data");
        }

        // Bước 4: Lấy dữ liệu địa giới từ remote API, fallback sang file bundled nếu remote lỗi/rỗng.
        List<LocationSeedClient.LocationSeedProvince> locationData = fetchLocationDataWithFallback();
        if (locationData.isEmpty()) {
            throw new IllegalStateException("No Vietnam location seed data available from remote API or bundled fallback");
        }

        // Bước 5: Tách dữ liệu lồng nhau thành ba danh sách entity province/district/ward.
        List<Province> provinces = locationData.stream()
                .map(this::toProvince)
                .toList();
        List<District> districts = locationData.stream()
                .flatMap(province -> province.districts().stream())
                .map(this::toDistrict)
                .toList();
        List<Ward> wards = locationData.stream()
                .flatMap(province -> province.districts().stream())
                .flatMap(district -> district.wards().stream())
                .map(this::toWard)
                .toList();

        // Bước 6: Lưu master data theo thứ tự cha trước, con sau để đảm bảo khóa ngoại.
        provinceRepository.saveAll(provinces);
        districtRepository.saveAll(districts);
        wardRepository.saveAll(wards);

        log.info("Vietnam location seed completed: {} provinces, {} districts, {} wards",
                provinces.size(), districts.size(), wards.size());
    }

    private List<LocationSeedClient.LocationSeedProvince> fetchLocationDataWithFallback() {
        try {
            // Bước 1: Ưu tiên nguồn remote để lấy dữ liệu địa giới mới nhất theo cấu hình.
            List<LocationSeedClient.LocationSeedProvince> remoteData = locationSeedClient.fetchLocations();
            if (!remoteData.isEmpty()) {
                return remoteData;
            }

            log.warn("Vietnam location seed API returned no data, falling back to bundled seed");
        } catch (Exception exception) {
            log.warn("Vietnam location seed API failed, falling back to bundled seed", exception);
        }

        // Bước 2: Khi remote không dùng được, đọc dữ liệu dự phòng đóng gói cùng ứng dụng.
        return bundledLocationSeedLoader.loadLocations();
    }

    private Province toProvince(LocationSeedClient.LocationSeedProvince source) {
        Province province = new Province();
        province.setCode(source.code());
        province.setName(source.name());
        return province;
    }

    private District toDistrict(LocationSeedClient.LocationSeedDistrict source) {
        District district = new District();
        district.setCode(source.code());
        district.setProvinceCode(source.provinceCode());
        district.setName(source.name());
        return district;
    }

    private Ward toWard(LocationSeedClient.LocationSeedWard source) {
        Ward ward = new Ward();
        ward.setCode(source.code());
        ward.setDistrictCode(source.districtCode());
        ward.setName(source.name());
        return ward;
    }
}
