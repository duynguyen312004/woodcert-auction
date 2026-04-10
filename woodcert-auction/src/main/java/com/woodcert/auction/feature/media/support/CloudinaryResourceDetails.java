package com.woodcert.auction.feature.media.support;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CloudinaryResourceDetails(
        @JsonProperty("asset_id")
        String assetId,

        @JsonProperty("public_id")
        String publicId,

        @JsonProperty("resource_type")
        String resourceType,

        Long version,
        String format,
        Long bytes,
        Integer width,
        Integer height,
        Double duration,

        @JsonProperty("secure_url")
        String secureUrl,

        @JsonProperty("original_filename")
        String originalFilename
) {
}
