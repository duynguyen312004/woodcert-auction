package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.Bid;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    Optional<Bid> findByBidTraceId(String bidTraceId);

    boolean existsByBidTraceId(String bidTraceId);

    Optional<Bid> findTopByAuctionSessionIdAndStatusOrderByBidAmountDescBidTimeDescIdDesc(
            Long auctionSessionId,
            BidStatus status);
}
