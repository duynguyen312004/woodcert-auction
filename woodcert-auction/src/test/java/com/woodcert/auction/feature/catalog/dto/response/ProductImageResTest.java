package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.ProductImage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductImageResTest {

    @Test
    void fromEntityIncludesMediaIdForDraftEdit() {
        ProductImage image = new ProductImage();
        image.setId(10L);
        image.setMediaId(99L);
        image.setPrimary(true);
        image.setSortOrder(0);

        ProductImageRes result = ProductImageRes.fromEntity(
                image,
                "https://cdn.example/product.jpg"
        );

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.mediaId()).isEqualTo(99L);
        assertThat(result.imageUrl()).isEqualTo("https://cdn.example/product.jpg");
        assertThat(result.isPrimary()).isTrue();
        assertThat(result.sortOrder()).isZero();
    }
}
