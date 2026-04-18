package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductImage;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared helper for product image URL resolution.
 * Extracted from ProductServiceImpl and AppraisalServiceImpl to eliminate duplication.
 */
@Component
@RequiredArgsConstructor
public class ProductImageHelper {

    private final ProductImageRepository productImageRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final MediaUrlBuilder mediaUrlBuilder;

    /**
     * Build the delivery URL for a single product image.
     * Prefers the eagerly-loaded mediaAsset; falls back to a repository lookup.
     */
    public String buildImageUrl(ProductImage image) {
        if (image.getMediaAsset() != null) {
            return mediaUrlBuilder.buildProductImageUrl(image.getMediaAsset());
        }
        return mediaAssetRepository.findById(image.getMediaId())
                .map(mediaUrlBuilder::buildProductImageUrl)
                .orElse(null);
    }

    /**
     * Find the primary image URL for a single product.
     * Falls back to the first image by sortOrder if no primary flag is present.
     */
    public String findPrimaryImageUrl(Product product) {
        List<ProductImage> images = productImageRepository
                .findByProductIdOrderBySortOrderAsc(product.getId());
        return images.stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(this::buildImageUrl)
                .orElse(images.isEmpty() ? null : buildImageUrl(images.get(0)));
    }

    /**
     * Batch-load list thumbnail URLs for a collection of products.
     * Prefers the primary image; falls back to the first image by sortOrder.
     */
    public Map<Long, String> batchLoadPrimaryImageUrls(Collection<Product> products) {
        if (products == null || products.isEmpty()) {
            return Map.of();
        }

        List<Long> productIds = products.stream()
                .map(Product::getId)
                .toList();

        List<ProductImage> images = productImageRepository
                .findImagesByProductIdsOrderByProductIdAscSortOrderAsc(productIds);

        Map<Long, ProductImage> selectedImages = new LinkedHashMap<>();
        for (ProductImage image : images) {
            ProductImage current = selectedImages.get(image.getProductId());
            if (current == null || image.isPrimary()) {
                selectedImages.put(image.getProductId(), image);
            }
        }

        Map<Long, String> imageUrls = new LinkedHashMap<>();
        selectedImages.forEach((productId, image) -> imageUrls.put(productId, buildImageUrl(image)));
        return imageUrls;
    }
}
