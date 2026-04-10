package com.woodcert.auction.feature.media.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateMediaUploadIntentReq(
        @NotBlank(message = "Original file name is required")
        @Size(max = 255, message = "Original file name must not exceed 255 characters")
        String originalFileName,

        @NotBlank(message = "Content type is required")
        @Size(max = 100, message = "Content type must not exceed 100 characters")
        String contentType,

        @NotNull(message = "File size is required")
        @Positive(message = "File size must be greater than zero")
        Long fileSize
) {
}
