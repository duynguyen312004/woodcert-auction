package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.response.AddressRes;
import com.woodcert.auction.feature.identity.entity.Address;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.Province;
import com.woodcert.auction.feature.identity.entity.District;
import com.woodcert.auction.feature.identity.entity.Ward;
import com.woodcert.auction.feature.identity.repository.AddressRepository;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressRes> getCurrentUserAddresses(String userId) {
        return addressRepository.findByUser_IdOrderByIsDefaultDescIdAsc(userId).stream()
                .map(this::mapToAddressRes)
                .toList();
    }

    @Override
    @Transactional
    public AddressRes createAddress(String userId, CreateAddressReq request) {
        // Bước 1: Đọc user để gắn địa chỉ mới vào đúng chủ sở hữu.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        // Bước 2: Chuẩn hóa mã tỉnh/huyện/xã trước khi kiểm tra quan hệ phân cấp.
        String normalizedProvinceCode = IdentityNormalizationUtils.normalizeProvinceCode(request.provinceCode());
        String normalizedDistrictCode = IdentityNormalizationUtils.normalizeDistrictCode(request.districtCode());
        String normalizedWardCode = IdentityNormalizationUtils.normalizeWardCode(request.wardCode());

        // Bước 3: Kiểm tra huyện thuộc tỉnh và xã thuộc huyện để tránh địa chỉ sai dữ liệu master.
        validateLocationHierarchy(normalizedProvinceCode, normalizedDistrictCode, normalizedWardCode);

        // Bước 4: Nếu địa chỉ mới là mặc định thì bỏ cờ mặc định ở các địa chỉ cũ của user.
        if (request.isDefault()) {
            addressRepository.clearDefaultByUserId(userId);
        }

        // Bước 5: Tạo địa chỉ mới với dữ liệu đã trim/chuẩn hóa rồi lưu DB.
        Address address = new Address();
        address.setUser(user);
        address.setReceiverName(request.receiverName().trim());
        address.setPhoneNumber(IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(request.phoneNumber()));
        address.setStreetAddress(request.streetAddress().trim());
        address.setProvinceCode(normalizedProvinceCode);
        address.setDistrictCode(normalizedDistrictCode);
        address.setWardCode(normalizedWardCode);
        address.setDefault(request.isDefault());

        Address savedAddress = addressRepository.save(address);
        return mapToAddressRes(savedAddress);
    }

    private AddressRes mapToAddressRes(Address address) {
        String provinceName = provinceRepository.findById(address.getProvinceCode())
                .map(Province::getName)
                .orElse(null);
        String districtName = districtRepository.findById(address.getDistrictCode())
                .map(District::getName)
                .orElse(null);
        String wardName = wardRepository.findById(address.getWardCode())
                .map(Ward::getName)
                .orElse(null);
        return AddressRes.fromEntity(address, provinceName, districtName, wardName);
    }

    private void validateLocationHierarchy(String provinceCode, String districtCode, String wardCode) {
        if (!provinceRepository.existsById(provinceCode)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Province code is invalid");
        }
        if (!districtRepository.existsByCodeAndProvinceCode(districtCode, provinceCode)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "District does not belong to the provided province");
        }
        if (!wardRepository.existsByCodeAndDistrictCode(wardCode, districtCode)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ward does not belong to the provided district");
        }
    }
}
