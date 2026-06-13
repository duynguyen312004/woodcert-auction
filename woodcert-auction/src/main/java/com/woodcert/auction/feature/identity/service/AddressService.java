package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateAddressReq;
import com.woodcert.auction.feature.identity.dto.response.AddressRes;

import java.util.List;

public interface AddressService {

    List<AddressRes> getCurrentUserAddresses(String userId);

    AddressRes createAddress(String userId, CreateAddressReq request);

    AddressRes updateAddress(String userId, Long addressId, UpdateAddressReq request);

    AddressRes setDefaultAddress(String userId, Long addressId);

    void deleteAddress(String userId, Long addressId);
}
