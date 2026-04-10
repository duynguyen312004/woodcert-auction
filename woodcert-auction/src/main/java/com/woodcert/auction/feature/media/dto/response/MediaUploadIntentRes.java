package com.woodcert.auction.feature.media.dto.response;

public record MediaUploadIntentRes(
        Long mediaId,
        String uploadUrl,
        String cloudName,
        String apiKey,
        String assetFolder,
        String publicId,
        String resourceType,
        long timestamp,
        String signature
) {
}
