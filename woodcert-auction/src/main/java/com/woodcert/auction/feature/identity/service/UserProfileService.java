package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.PatchUserProfileReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateUserProfileReq;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;

public interface UserProfileService {

    UserProfileRes getCurrentUserProfile(String userId);

    UserProfileRes updateCurrentUserProfile(String userId, UpdateUserProfileReq request);

    UserProfileRes patchCurrentUserProfile(String userId, PatchUserProfileReq request);
}
