package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.catalog.dto.request.CreateProductReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateProductReq;
import com.woodcert.auction.feature.catalog.dto.response.ProductDetailRes;
import com.woodcert.auction.feature.catalog.dto.response.ProductListRes;
import com.woodcert.auction.feature.catalog.dto.response.SellerProductStatsRes;
import com.woodcert.auction.feature.catalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Product CRUD + lifecycle controller.
 * Media upload endpoints have been moved to {@link ProductMediaController}.
 */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Internal catalog list for seller/appraiser workflow.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginationResponse<ProductListRes>>> getCatalogProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String saleStatus,
            @CurrentUserId String userId) {
        boolean isAppraiser = hasAuthority("APPROVE_PRODUCT");
        PaginationResponse<ProductListRes> result = productService.getCatalogProducts(
                userId, isAppraiser, page, size, categoryId, status, saleStatus);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch products successful"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<SellerProductStatsRes>> getSellerProductStats(
            @CurrentUserId String sellerId) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.getSellerProductStats(sellerId),
                "Fetch seller product stats successful"));
    }

    /**
     * Internal catalog detail for seller/appraiser workflow.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProductDetailRes>> getProductDetail(
            @PathVariable Long id,
            @CurrentUserId String userId) {
        boolean isAppraiser = hasAuthority("APPROVE_PRODUCT");
        ProductDetailRes product = productService.getProductDetail(id, userId, isAppraiser);
        return ResponseEntity.ok(ApiResponse.success(product, "Fetch product successful"));
    }

    /**
     * Seller: Create a new DRAFT product.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<ProductDetailRes>> createProduct(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateProductReq request) {
        ProductDetailRes product = productService.createProduct(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(product, "Product created successfully"));
    }

    /**
     * Seller: Update a DRAFT product. Removed images are queued for Cloudinary cleanup.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<ProductDetailRes>> updateProduct(
            @CurrentUserId String userId,
            @PathVariable Long id,
            @RequestBody @Valid UpdateProductReq request) {
        ProductDetailRes product = productService.updateProduct(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(product, "Product updated successfully"));
    }

    /**
     * Seller: Delete a DRAFT product and queue all images for Cloudinary cleanup.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CREATE_PRODUCT')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        productService.deleteProduct(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }

    /**
     * Seller: Submit DRAFT product for appraisal.
     */
    @PostMapping("/{id}/submit-appraisal")
    @PreAuthorize("hasAuthority('SUBMIT_APPRAISAL_REQUEST')")
    public ResponseEntity<ApiResponse<Void>> submitForAppraisal(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        productService.submitForAppraisal(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product submitted for appraisal successfully"));
    }

    // --- Private helpers ---

    /**
     * Check if the current authenticated user has a specific authority.
     * Returns false if there is no usable authentication context.
     */
    private boolean hasAuthority(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }
}
