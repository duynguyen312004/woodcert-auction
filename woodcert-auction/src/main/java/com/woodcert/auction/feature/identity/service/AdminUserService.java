package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;

public interface AdminUserService {

    PaginationResponse<AdminUserRes> getUsers(String role, String status, String query, int page, int size);

    AdminUserRes banUser(String userId, String currentUserId);

    AdminUserRes unbanUser(String userId);
}
