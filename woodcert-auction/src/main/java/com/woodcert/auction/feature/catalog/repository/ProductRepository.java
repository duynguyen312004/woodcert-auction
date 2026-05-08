package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    Page<Product> findByStatusAndCategoryId(ProductStatus status, Integer categoryId, Pageable pageable);

    Page<Product> findBySellerId(String sellerId, Pageable pageable);

    Page<Product> findBySellerIdAndCategoryId(String sellerId, Integer categoryId, Pageable pageable);

    Page<Product> findBySellerIdAndStatus(String sellerId, ProductStatus status, Pageable pageable);

    Page<Product> findBySellerIdAndStatusAndCategoryId(
            String sellerId, ProductStatus status, Integer categoryId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id = :id
            """)
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT p FROM Product p
            WHERE p.sellerId = :sellerId
              AND (:status IS NULL OR p.status = :status)
              AND (:categoryId IS NULL OR p.categoryId = :categoryId)
            """)
    Page<Product> findCatalogProductsForSeller(
            @Param("sellerId") String sellerId,
            @Param("status") ProductStatus status,
            @Param("categoryId") Integer categoryId,
            Pageable pageable);

    @Query("""
            SELECT DISTINCT p
            FROM Product p
            LEFT JOIN p.appraisalReport ar
            WHERE (:status IS NULL OR p.status = :status)
              AND (:categoryId IS NULL OR p.categoryId = :categoryId)
              AND (
                   p.status = :pendingStatus
                   OR (p.status IN :reviewedStatuses AND ar.appraiserId = :appraiserId)
              )
            """)
    Page<Product> findCatalogProductsForAppraiser(
            @Param("appraiserId") String appraiserId,
            @Param("status") ProductStatus status,
            @Param("categoryId") Integer categoryId,
            @Param("pendingStatus") ProductStatus pendingStatus,
            @Param("reviewedStatuses") Collection<ProductStatus> reviewedStatuses,
            Pageable pageable);

    /**
     * Fetch product with category and appraisal report eagerly loaded for detail view.
     */
    @Query("""
            SELECT p
            FROM Product p
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH p.appraisalReport
            WHERE p.id = :id
            """)
    Optional<Product> findByIdWithCategoryAndAppraisalReport(@Param("id") Long id);
}
