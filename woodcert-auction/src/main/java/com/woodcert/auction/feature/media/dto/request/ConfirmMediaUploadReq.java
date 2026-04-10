package com.woodcert.auction.feature.media.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmMediaUploadReq(
        @NotNull(message = "Media id is required")
        Long mediaId,

        @NotBlank(message = "Asset id is required")
        String assetId
) {
}
