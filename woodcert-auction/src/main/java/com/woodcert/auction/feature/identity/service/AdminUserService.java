package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.UserCapability;

public interface AdminUserService {

    PaginationResponse<AdminUserRes> getUsers(String role, String status, String query, int page, int size);

    AdminUserRes banUser(String userId, String currentUserId, String reason);

    AdminUserRes unbanUser(String userId, String currentUserId, String reason);

    AdminUserRes banCapability(String userId, UserCapability capability, String currentUserId, String reason);

    AdminUserRes unbanCapability(String userId, UserCapability capability, String currentUserId, String reason);
}
