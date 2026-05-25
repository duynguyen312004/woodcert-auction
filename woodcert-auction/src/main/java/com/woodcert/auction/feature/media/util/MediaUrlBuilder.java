package com.woodcert.auction.feature.media.util;

import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MediaUrlBuilder {

    private static final String AVATAR_TRANSFORMATION = "c_fill,f_auto,g_face,h_256,q_auto,w_256";
    private static final String PRODUCT_IMAGE_TRANSFORMATION = "c_limit,f_auto,h_800,q_auto,w_800";
    private static final String APPRAISAL_IMAGE_TRANSFORMATION = "c_limit,f_auto,h_900,q_auto,w_900";

    private final CloudinaryProperties properties;

    public String buildAvatarUrl(MediaAsset asset) {
        return buildDeliveryUrl(asset, AVATAR_TRANSFORMATION);
    }

    public String buildProductImageUrl(MediaAsset asset) {
        return buildDeliveryUrl(asset, PRODUCT_IMAGE_TRANSFORMATION);
    }

    public String buildAppraisalImageUrl(MediaAsset asset) {
        return buildDeliveryUrl(asset, APPRAISAL_IMAGE_TRANSFORMATION);
    }

    public String buildDeliveryUrl(MediaAsset asset, String transformation) {
        if (asset == null || asset.getPublicId() == null || asset.getPublicId().isBlank()) {
            return null;
        }

        String protocol = properties.isSecure() ? "https" : "http";
        StringBuilder url = new StringBuilder()
                .append(protocol)
                .append("://res.cloudinary.com/")
                .append(properties.getCloudName())
                .append("/")
                .append(asset.getResourceType().getCloudinaryValue())
                .append("/upload/");

        if (transformation != null && !transformation.isBlank()) {
            url.append(transformation.trim()).append("/");
        }

        if (asset.getVersion() != null) {
            url.append("v").append(asset.getVersion()).append("/");
        }

        url.append(asset.getPublicId());
        return url.toString();
    }
}
