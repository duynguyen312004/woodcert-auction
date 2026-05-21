package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test mapping cho ProductListRes.
 *
 * Dashboard seller và danh sách catalog cần response gọn này có đủ chất liệu và
 * ảnh chính.
 */
class ProductListResTest {

    @Test
    void fromEntityIncludesMaterialForSellerDashboard() {
        Product product = new Product();
        product.setId(10L);
        product.setTitle("Wood statue");
        product.setMaterial("Rosewood");
        product.setStatus(ProductStatus.APPRAISED);

        ProductListRes result = ProductListRes.fromEntity(product, "https://cdn.example/image.jpg");

        assertThat(result.material()).isEqualTo("Rosewood");
        assertThat(result.primaryImage()).isEqualTo("https://cdn.example/image.jpg");
    }
}
