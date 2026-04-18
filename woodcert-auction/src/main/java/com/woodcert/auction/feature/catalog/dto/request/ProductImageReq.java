package com.woodcert.auction.feature.catalog.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Single product image reference using media asset ID.
 * Client must create an upload intent and confirm the upload before referencing a mediaId here.
 */
public record ProductImageReq(
        @NotNull(message = "Media ID is required")
        Long mediaId,

        @NotNull(message = "isPrimary is required")
        Boolean isPrimary,

        @NotNull(message = "Sort order is required")
        @Min(value = 0, message = "Sort order must be >= 0")
        Integer sortOrder
) {
}
