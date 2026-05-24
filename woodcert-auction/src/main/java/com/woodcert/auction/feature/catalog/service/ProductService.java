package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.catalog.dto.request.CreateProductReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateProductReq;
import com.woodcert.auction.feature.catalog.dto.response.ProductDetailRes;
import com.woodcert.auction.feature.catalog.dto.response.ProductListRes;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;

/**
 * Product service interface.
 */
public interface ProductService {

    /**
     * Create a signed Cloudinary upload intent for a product image.
     */
    MediaUploadIntentRes createProductImageUploadIntent(String sellerId, CreateMediaUploadIntentReq request);

    /**
     * Confirm a product image upload owned by the current seller.
     */
    void confirmProductImageUpload(String sellerId, ConfirmMediaUploadReq request);

    /**
     * Create a new DRAFT product with images referencing confirmed media assets.
     */
    ProductDetailRes createProduct(String sellerId, CreateProductReq request);

    /**
     * Update a DRAFT product. Removed images are marked for Cloudinary cleanup.
     */
    ProductDetailRes updateProduct(String sellerId, Long productId, UpdateProductReq request);

    /**
     * Delete a DRAFT product and mark all associated media for cleanup.
     */
    void deleteProduct(String sellerId, Long productId);

    /**
     * Submit a DRAFT product for appraisal. Status changes to PENDING_APPRAISAL.
     */
    void submitForAppraisal(String sellerId, Long productId);

    /**
     * List internal catalog products visible to the current seller or appraiser.
     */
    PaginationResponse<ProductListRes> getCatalogProducts(
            String userId,
            boolean isAppraiser,
            int page,
            int size,
            Integer categoryId,
            String status,
            String saleStatus);

    /**
     * Get internal catalog product details including images and appraisal report.
     * Access control:
     * - owner: any status
     * - appraiser: PENDING_APPRAISAL, plus APPRAISED/REJECTED that they appraised
     * - everyone else: PRODUCT_NOT_FOUND
     *
     * @param productId   the product ID
     * @param userId      the requesting authenticated user ID
     * @param isAppraiser whether the requesting user has appraiser authority
     */
    ProductDetailRes getProductDetail(Long productId, String userId, boolean isAppraiser);
}
