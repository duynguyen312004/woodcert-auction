package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.CreateSellerProfileReq;
import com.woodcert.auction.feature.identity.dto.response.SellerProfileRes;

public interface SellerProfileService {

    SellerProfileRes getCurrentSellerProfile(String userId);

    SellerProfileRes createSellerProfile(String userId, CreateSellerProfileReq request);
}
