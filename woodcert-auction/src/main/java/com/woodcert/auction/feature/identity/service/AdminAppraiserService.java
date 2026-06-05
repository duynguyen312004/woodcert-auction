package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;

public interface AdminAppraiserService {

    AdminUserRes createAppraiser(String adminId, CreateAdminAppraiserReq request);

    AdminUserRes banAppraiser(String adminId, String userId, String reason);

    AdminUserRes unbanAppraiser(String adminId, String userId, String reason);
}
