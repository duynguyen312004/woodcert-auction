package com.woodcert.auction.feature.dispute.dto.response;

import com.woodcert.auction.feature.dispute.entity.DisputeEvidence;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;

public record DisputeEvidenceRes(
        Long id,
        Long mediaId,
        String url,
        String originalFilename,
        int sortOrder
) {
    private static final String EVIDENCE_TRANSFORMATION = "c_limit,f_auto,h_900,q_auto,w_900";

    public static DisputeEvidenceRes fromEntity(DisputeEvidence evidence, MediaUrlBuilder mediaUrlBuilder) {
        MediaAsset asset = evidence.getMediaAsset();
        return new DisputeEvidenceRes(
                evidence.getId(),
                evidence.getMediaId(),
                mediaUrlBuilder.buildDeliveryUrl(asset, EVIDENCE_TRANSFORMATION),
                asset != null ? asset.getOriginalFilename() : null,
                evidence.getSortOrder()
        );
    }
}
