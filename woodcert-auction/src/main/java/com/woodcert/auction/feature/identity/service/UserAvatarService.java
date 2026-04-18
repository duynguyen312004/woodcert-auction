package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;

public interface UserAvatarService {

    MediaUploadIntentRes createCurrentUserAvatarUploadIntent(String userId, CreateMediaUploadIntentReq request);

    UserProfileRes attachCurrentUserAvatar(String userId, ConfirmMediaUploadReq request);

    UserProfileRes clearCurrentUserAvatar(String userId);
}
