package com.woodcert.auction.feature.media.entity;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;

public enum MediaResourceType {
    IMAGE("image"),
    VIDEO("video"),
    RAW("raw");

    private final String cloudinaryValue;

    MediaResourceType(String cloudinaryValue) {
        this.cloudinaryValue = cloudinaryValue;
    }

    public String getCloudinaryValue() {
        return cloudinaryValue;
    }

    public static MediaResourceType fromCloudinaryValue(String value) {
        for (MediaResourceType type : values()) {
            if (type.cloudinaryValue.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new AppException(ErrorCode.INVALID_REQUEST, "Unsupported media resource type");
    }
}
