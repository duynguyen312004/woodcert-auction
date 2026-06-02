package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.Bid;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    Optional<Bid> findByBidTraceId(String bidTraceId);

    boolean existsByBidTraceId(String bidTraceId);

    Optional<Bid> findTopByAuctionSessionIdAndStatusOrderByBidAmountDescBidTimeDescIdDesc(
            Long auctionSessionId,
            BidStatus status);

    List<Bid> findByAuctionSessionIdAndStatusOrderByBidTimeDesc(
            Long auctionSessionId,
            BidStatus status,
            Pageable pageable);

    long countByAuctionSessionIdAndUserIdAndStatus(Long auctionSessionId, String userId, BidStatus status);

    @Query("""
            SELECT MAX(b.bidAmount)
            FROM Bid b
            WHERE b.auctionSessionId = :auctionSessionId
              AND b.userId = :userId
              AND b.status = :status
            """)
    Optional<java.math.BigDecimal> findMaxBidAmountBySessionAndUser(
            @Param("auctionSessionId") Long auctionSessionId,
            @Param("userId") String userId,
            @Param("status") BidStatus status);
}
