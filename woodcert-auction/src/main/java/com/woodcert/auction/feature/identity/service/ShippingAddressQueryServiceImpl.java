package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.entity.Address;
import com.woodcert.auction.feature.identity.repository.AddressRepository;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShippingAddressQueryServiceImpl implements ShippingAddressQueryService {

    private final AddressRepository addressRepository;
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    @Override
    @Transactional(readOnly = true)
    public ShippingAddressSnapshot getOwnedAddressSnapshot(String userId, Long addressId) {
        Address address = addressRepository.findByIdAndUser_Id(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SHIPPING_ADDRESS_NOT_FOUND));

        String provinceName = provinceRepository.findById(address.getProvinceCode())
                .map(province -> province.getName())
                .orElse(null);
        String districtName = districtRepository.findById(address.getDistrictCode())
                .map(district -> district.getName())
                .orElse(null);
        String wardName = wardRepository.findById(address.getWardCode())
                .map(ward -> ward.getName())
                .orElse(null);

        return new ShippingAddressSnapshot(
                address.getReceiverName(),
                address.getPhoneNumber(),
                address.getStreetAddress(),
                address.getWardCode(),
                wardName,
                address.getDistrictCode(),
                districtName,
                address.getProvinceCode(),
                provinceName
        );
    }
}
