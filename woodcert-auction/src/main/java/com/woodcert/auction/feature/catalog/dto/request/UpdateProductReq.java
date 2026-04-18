package com.woodcert.auction.feature.catalog.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request to update a DRAFT product.
 * Only DRAFT products can be updated. Images are fully replaced (diff-based cleanup).
 */
public record UpdateProductReq(
        @NotNull(message = "Category ID is required")
        Integer categoryId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        String description,

        @Size(max = 100, message = "Material must not exceed 100 characters")
        String material,

        @Size(max = 100, message = "Dimensions must not exceed 100 characters")
        String dimensions,

        @DecimalMin(value = "0.01", message = "Weight must be greater than 0")
        BigDecimal weight,

        @NotEmpty(message = "At least one image is required")
        @Size(max = 10, message = "A product can have at most 10 images")
        @Valid
        List<ProductImageReq> images
) {
}
