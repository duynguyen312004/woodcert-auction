package com.woodcert.auction.feature.dispute.repository;

import com.woodcert.auction.feature.dispute.entity.DisputeMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeMessageRepository extends JpaRepository<DisputeMessage, Long> {

    List<DisputeMessage> findByDisputeCaseIdOrderByCreatedAtAscIdAsc(Long disputeCaseId);
}
