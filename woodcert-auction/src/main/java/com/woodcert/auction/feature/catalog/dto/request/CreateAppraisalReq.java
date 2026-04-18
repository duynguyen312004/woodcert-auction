package com.woodcert.auction.feature.catalog.dto.request;

import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request for an appraiser to submit an appraisal report for a product.
 * If isAuthentic = false, the product is REJECTED and appraiserNotes becomes the rejection reason.
 */
public record CreateAppraisalReq(
        @NotNull(message = "isAuthentic is required")
        Boolean isAuthentic,

        @NotBlank(message = "Verified material is required")
        @Size(max = 100, message = "Verified material must not exceed 100 characters")
        String verifiedMaterial,

        @Size(max = 100, message = "Origin must not exceed 100 characters")
        String origin,

        @Size(max = 50, message = "Age estimation must not exceed 50 characters")
        String ageEstimation,

        ConditionGrade conditionGrade,

        @NotNull(message = "Estimated value is required")
        @DecimalMin(value = "0", message = "Estimated value must be >= 0")
        BigDecimal estimatedValue,

        String appraiserNotes,

        @DecimalMin(value = "1", message = "Seller accuracy must be between 1 and 5")
        @DecimalMax(value = "5", message = "Seller accuracy must be between 1 and 5")
        BigDecimal sellerAccuracy,

        @Valid
        List<AppraisalImageReq> proofImages
) {
}
