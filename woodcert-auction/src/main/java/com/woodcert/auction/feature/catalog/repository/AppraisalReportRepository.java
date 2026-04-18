package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppraisalReportRepository extends JpaRepository<AppraisalReport, Long> {

    Optional<AppraisalReport> findByProductId(Long productId);

    boolean existsByProductId(Long productId);

    Optional<AppraisalReport> findByCertificateCode(String certificateCode);
}
