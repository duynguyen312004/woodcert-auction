package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.ProductStatus;

/**
 * Response after an appraiser submits an appraisal report.
 */
public record AppraisalSubmitRes(
        Long reportId,
        Long productId,
        String certificateCode,
        ProductStatus newProductStatus
) {
}
