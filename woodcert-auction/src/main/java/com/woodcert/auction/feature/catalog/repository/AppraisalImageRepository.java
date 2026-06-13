package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.AppraisalImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppraisalImageRepository extends JpaRepository<AppraisalImage, Long> {

    List<AppraisalImage> findByAppraisalReportIdOrderByIdAsc(Long appraisalReportId);
}
