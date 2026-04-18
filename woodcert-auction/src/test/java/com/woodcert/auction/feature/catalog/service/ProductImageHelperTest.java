package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductImage;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImageHelperTest {

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private MediaAssetRepository mediaAssetRepository;

    @Mock
    private MediaUrlBuilder mediaUrlBuilder;

    @InjectMocks
    private ProductImageHelper productImageHelper;

    @Test
    @DisplayName("batchLoadPrimaryImageUrls should fall back to first image when no primary exists")
    void batchLoadPrimaryImageUrls_fallsBackToFirstImage() {
        Product product = new Product();
        product.setId(1L);

        ProductImage firstImage = createImage(1L, 100L, false, 0);
        ProductImage secondImage = createImage(1L, 101L, false, 1);

        when(productImageRepository.findImagesByProductIdsOrderByProductIdAscSortOrderAsc(List.of(1L)))
                .thenReturn(List.of(firstImage, secondImage));
        when(mediaAssetRepository.findById(100L)).thenReturn(java.util.Optional.of(new MediaAsset()));
        when(mediaUrlBuilder.buildProductImageUrl(org.mockito.ArgumentMatchers.any(MediaAsset.class)))
                .thenReturn("first-url");

        Map<Long, String> result = productImageHelper.batchLoadPrimaryImageUrls(List.of(product));

        assertThat(result).containsEntry(1L, "first-url");
    }

    @Test
    @DisplayName("batchLoadPrimaryImageUrls should prefer primary image over earlier non-primary image")
    void batchLoadPrimaryImageUrls_prefersPrimaryImage() {
        Product product = new Product();
        product.setId(1L);

        ProductImage firstImage = createImage(1L, 100L, false, 0);
        ProductImage primaryImage = createImage(1L, 101L, true, 1);

        MediaAsset primaryAsset = new MediaAsset();
        primaryImage.setMediaAsset(primaryAsset);

        when(productImageRepository.findImagesByProductIdsOrderByProductIdAscSortOrderAsc(List.of(1L)))
                .thenReturn(List.of(firstImage, primaryImage));
        when(mediaUrlBuilder.buildProductImageUrl(primaryAsset)).thenReturn("primary-url");

        Map<Long, String> result = productImageHelper.batchLoadPrimaryImageUrls(List.of(product));

        assertThat(result).containsEntry(1L, "primary-url");
    }

    @Test
    @DisplayName("findPrimaryImageUrl should fall back to first image when no primary exists")
    void findPrimaryImageUrl_fallsBackToFirstImage() {
        Product product = new Product();
        product.setId(1L);

        ProductImage firstImage = createImage(1L, 100L, false, 0);

        when(productImageRepository.findByProductIdOrderBySortOrderAsc(1L))
                .thenReturn(List.of(firstImage));
        when(mediaAssetRepository.findById(100L)).thenReturn(java.util.Optional.of(new MediaAsset()));
        when(mediaUrlBuilder.buildProductImageUrl(org.mockito.ArgumentMatchers.any(MediaAsset.class)))
                .thenReturn("detail-url");

        String result = productImageHelper.findPrimaryImageUrl(product);

        assertThat(result).isEqualTo("detail-url");
    }

    private ProductImage createImage(Long productId, Long mediaId, boolean isPrimary, int sortOrder) {
        ProductImage image = new ProductImage();
        image.setProductId(productId);
        image.setMediaId(mediaId);
        image.setPrimary(isPrimary);
        image.setSortOrder(sortOrder);
        return image;
    }
}
