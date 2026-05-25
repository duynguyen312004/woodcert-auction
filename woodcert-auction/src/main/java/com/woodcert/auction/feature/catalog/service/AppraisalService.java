package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;

/**
 * Appraisal service interface for appraiser operations.
 */
public interface AppraisalService {

    /**
     * Create a signed Cloudinary upload intent for an appraisal proof image.
     */
    MediaUploadIntentRes createAppraisalImageUploadIntent(String appraiserId, CreateMediaUploadIntentReq request);

    /**
     * Confirm an appraisal proof image upload owned by the current appraiser.
     */
    void confirmAppraisalImageUpload(String appraiserId, ConfirmMediaUploadReq request);

    /**
     * Claim a product before writing an appraisal report.
     * The caller is responsible for fetching full product detail after this call.
     */
    void claimProductForAppraisal(String appraiserId, Long productId);

    /**
     * Release an active appraisal claim owned by the current appraiser.
     * The caller is responsible for fetching full product detail after this call.
     */
    void releaseAppraisalClaim(String appraiserId, Long productId);

    /**
     * Appraiser submits an appraisal report for a product.
     * If isAuthentic = true → product status = APPRAISED
     * If isAuthentic = false → product status = REJECTED
     */
    AppraisalSubmitRes submitAppraisal(String appraiserId, Long productId, CreateAppraisalReq request);
}
