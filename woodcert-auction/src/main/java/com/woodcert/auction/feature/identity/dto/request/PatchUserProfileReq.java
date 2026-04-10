package com.woodcert.auction.feature.identity.dto.request;

import com.fasterxml.jackson.databind.JsonNode;

public record PatchUserProfileReq(
        JsonNode fullName,
        JsonNode phoneNumber
) {
    public boolean hasAnyField() {
        return fullName != null || phoneNumber != null;
    }
}
