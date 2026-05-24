package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.service.ProductService;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Media upload endpoints for product images.
 * Separated from ProductController to keep product CRUD focused.
 */
@RestController
@RequestMapping("/api/v1/products/images")
@RequiredArgsConstructor
public class ProductMediaController {

    private final ProductService productService;

    /**
     * Seller: Create a signed Cloudinary upload intent for a product image.
     */
    @PostMapping("/upload-intent")
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<MediaUploadIntentRes>> createUploadIntent(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateMediaUploadIntentReq request) {
        MediaUploadIntentRes intent = productService.createProductImageUploadIntent(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(intent, "Product image upload intent created successfully"));
    }

    /**
     * Seller: Confirm a product image upload after client-side Cloudinary upload.
     */
    @PutMapping("/confirm")
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<Void>> confirmUpload(
            @CurrentUserId String userId,
            @RequestBody @Valid ConfirmMediaUploadReq request) {
        productService.confirmProductImageUpload(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Product image confirmed successfully"));
    }
}
