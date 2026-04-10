package com.woodcert.auction.feature.media.support;

import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaUsageType;

public record MediaUploadContext(
        String ownerUserId,
        MediaUsageType usageType,
        MediaResourceType resourceType,
        String folder,
        long maxBytes,
        String allowedContentTypePrefix
) {
}
