package com.woodcert.auction.feature.dispute.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.dto.response.DisputeRes;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;

import java.util.List;

public interface DisputeService {

    MediaUploadIntentRes createEvidenceUploadIntent(String userId, CreateMediaUploadIntentReq request);

    void confirmEvidenceUpload(String userId, ConfirmMediaUploadReq request);

    DisputeRes openDispute(String buyerId, Long orderId, CreateDisputeReq request);

    DisputeRes getCurrentDispute(String userId, Long orderId);

    List<DisputeRes> getDisputeHistory(String userId, Long orderId);

    DisputeRes cancelDispute(String userId, Long orderId, Long disputeId);

    PaginationResponse<DisputeRes> getAdminDisputes(String status, int page, int size);

    DisputeRes getAdminDispute(Long disputeId);

    DisputeRes markUnderReview(String adminId, Long disputeId);

    DisputeRes resolveDispute(String adminId, Long disputeId, ResolveDisputeReq request);
}
