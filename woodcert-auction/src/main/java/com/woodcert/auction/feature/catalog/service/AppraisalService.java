package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
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
     * Appraiser submits an appraisal report for a product.
     * If isAuthentic = true → product status = APPRAISED
     * If isAuthentic = false → product status = REJECTED
     */
    AppraisalSubmitRes submitAppraisal(String appraiserId, Long productId, CreateAppraisalReq request);
}
