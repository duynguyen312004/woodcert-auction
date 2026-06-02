package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;

public interface AdminAppraiserService {

    PaginationResponse<AdminUserRes> getUsers(String query, int page, int size);

    AdminUserRes promoteAppraiser(String userId);

    AdminUserRes demoteAppraiser(String userId);
}
