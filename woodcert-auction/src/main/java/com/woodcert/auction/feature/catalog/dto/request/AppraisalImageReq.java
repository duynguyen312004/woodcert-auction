package com.woodcert.auction.feature.catalog.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Single appraisal proof image reference using media asset ID.
 */
public record AppraisalImageReq(
        @NotNull(message = "Media ID is required")
        Long mediaId,

        @Size(max = 255, message = "Description must not exceed 255 characters")
        String description
) {
}
