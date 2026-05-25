package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalImage;

/**
 * Proof image attached to an appraisal report.
 */
public record AppraisalImageRes(
        Long id,
        Long mediaId,
        String description,
        String imageUrl
) {
    public static AppraisalImageRes fromEntity(AppraisalImage image, String imageUrl) {
        return new AppraisalImageRes(
                image.getId(),
                image.getMediaId(),
                image.getDescription(),
                imageUrl
        );
    }
}
