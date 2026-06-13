package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateAddressReq;
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

        // Địa chỉ đầu tiên luôn là mặc định để checkout luôn có một lựa chọn hợp lệ.
        boolean isDefault = request.isDefault() || !addressRepository.existsByUser_Id(userId);
        if (isDefault) {
            addressRepository.clearDefaultByUserId(userId);
        }

        Address address = new Address();
        address.setUser(user);
        applyAddressFields(
                address,
                request.receiverName(),
                request.phoneNumber(),
                request.streetAddress(),
                normalizedProvinceCode,
                normalizedDistrictCode,
                normalizedWardCode);
        address.setDefault(isDefault);

        Address savedAddress = addressRepository.save(address);
        return mapToAddressRes(savedAddress);
    }

    @Override
    @Transactional
    public AddressRes updateAddress(String userId, Long addressId, UpdateAddressReq request) {
        Address address = getOwnedAddress(userId, addressId);
        String provinceCode = IdentityNormalizationUtils.normalizeProvinceCode(request.provinceCode());
        String districtCode = IdentityNormalizationUtils.normalizeDistrictCode(request.districtCode());
        String wardCode = IdentityNormalizationUtils.normalizeWardCode(request.wardCode());
        validateLocationHierarchy(provinceCode, districtCode, wardCode);

        applyAddressFields(
                address,
                request.receiverName(),
                request.phoneNumber(),
                request.streetAddress(),
                provinceCode,
                districtCode,
                wardCode);
        return mapToAddressRes(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressRes setDefaultAddress(String userId, Long addressId) {
        Address address = getOwnedAddress(userId, addressId);
        if (!address.isDefault()) {
            addressRepository.clearDefaultByUserId(userId);
            address.setDefault(true);
            address = addressRepository.save(address);
        }
        return mapToAddressRes(address);
    }

    @Override
    @Transactional
    public void deleteAddress(String userId, Long addressId) {
        Address address = getOwnedAddress(userId, addressId);
        Address replacement = address.isDefault()
                ? addressRepository.findFirstByUser_IdAndIdNotOrderByIdAsc(userId, addressId).orElse(null)
                : null;

        addressRepository.delete(address);
        if (replacement != null) {
            replacement.setDefault(true);
            addressRepository.save(replacement);
        }
    }

    private Address getOwnedAddress(String userId, Long addressId) {
        return addressRepository.findByIdAndUser_Id(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Address not found"));
    }

    private void applyAddressFields(
            Address address,
            String receiverName,
            String phoneNumber,
            String streetAddress,
            String provinceCode,
            String districtCode,
            String wardCode) {
        address.setReceiverName(receiverName.trim());
        address.setPhoneNumber(IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(phoneNumber));
        address.setStreetAddress(streetAddress.trim());
        address.setProvinceCode(provinceCode);
        address.setDistrictCode(districtCode);
        address.setWardCode(wardCode);
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
