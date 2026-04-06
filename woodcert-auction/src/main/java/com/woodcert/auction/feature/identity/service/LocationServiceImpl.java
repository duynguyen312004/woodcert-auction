package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.DistrictRes;
import com.woodcert.auction.feature.identity.dto.response.ProvinceRes;
import com.woodcert.auction.feature.identity.dto.response.WardRes;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProvinceRes> getProvinces() {
        return provinceRepository.findAllByOrderByNameAsc().stream()
                .map(ProvinceRes::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistrictRes> getDistricts(String provinceCode) {
        String normalizedProvinceCode = IdentityNormalizationUtils.normalizeProvinceCode(provinceCode);
        if (!provinceRepository.existsById(normalizedProvinceCode)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Province not found");
        }

        return districtRepository.findByProvinceCodeOrderByNameAsc(normalizedProvinceCode).stream()
                .map(DistrictRes::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WardRes> getWards(String districtCode) {
        String normalizedDistrictCode = IdentityNormalizationUtils.normalizeDistrictCode(districtCode);
        if (!districtRepository.existsById(normalizedDistrictCode)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "District not found");
        }

        return wardRepository.findByDistrictCodeOrderByNameAsc(normalizedDistrictCode).stream()
                .map(WardRes::fromEntity)
                .toList();
    }
}
