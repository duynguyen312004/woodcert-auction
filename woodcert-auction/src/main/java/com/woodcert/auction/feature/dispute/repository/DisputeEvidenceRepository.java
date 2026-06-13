package com.woodcert.auction.feature.dispute.repository;

import com.woodcert.auction.feature.dispute.entity.DisputeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, Long> {

    List<DisputeEvidence> findByDisputeCaseIdOrderBySortOrderAscIdAsc(Long disputeCaseId);

    List<DisputeEvidence> findByDisputeCaseIdIn(Collection<Long> disputeCaseIds);
}
