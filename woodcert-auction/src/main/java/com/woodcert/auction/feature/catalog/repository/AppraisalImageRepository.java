package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.AppraisalImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppraisalImageRepository extends JpaRepository<AppraisalImage, Long> {

    List<AppraisalImage> findByAppraisalReportId(Long appraisalReportId);
}
