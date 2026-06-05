package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;

public interface AdminAppraiserService {

    AdminUserRes createAppraiser(CreateAdminAppraiserReq request);

    AdminUserRes demoteAppraiser(String userId);
}
