package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalReportRepository extends JpaRepository<AppraisalReport, Long> {

    Optional<AppraisalReport> findByProductId(Long productId);

    List<AppraisalReport> findByProductIdIn(Collection<Long> productIds);

    boolean existsByProductId(Long productId);

    Optional<AppraisalReport> findByCertificateCode(String certificateCode);

    @Query("""
            SELECT ar
            FROM AppraisalReport ar
            LEFT JOIN FETCH ar.product p
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH p.seller s
            LEFT JOIN FETCH s.sellerProfile
            LEFT JOIN FETCH ar.appraiser a
            WHERE ar.certificateCode = :certificateCode
            """)
    Optional<AppraisalReport> findByCertificateCodeWithProduct(@Param("certificateCode") String certificateCode);

    /**
     * Tính điểm trung thực trung bình của toàn bộ appraisal thuộc một seller.
     */
    @Query(value = """
            SELECT AVG(ar.seller_accuracy)
            FROM appraisal_reports ar
            JOIN products p ON p.id = ar.product_id
            WHERE p.seller_id = :sellerId
            """, nativeQuery = true)
    Optional<BigDecimal> calculateAverageSellerAccuracyBySellerId(@Param("sellerId") String sellerId);
}
