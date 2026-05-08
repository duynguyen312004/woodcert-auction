package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionParticipantRepository extends JpaRepository<AuctionParticipant, Long> {

    boolean existsByAuctionSessionIdAndUserId(Long auctionSessionId, String userId);

    Optional<AuctionParticipant> findByAuctionSessionIdAndUserId(Long auctionSessionId, String userId);

    List<AuctionParticipant> findByAuctionSessionIdAndDepositStatus(Long auctionSessionId, DepositStatus depositStatus);

    @Query("""
            SELECT p.auctionSessionId AS auctionSessionId,
                   COUNT(p.id) AS participantCount
            FROM AuctionParticipant p
            WHERE p.auctionSessionId IN :auctionSessionIds
            GROUP BY p.auctionSessionId
            """)
    List<AuctionParticipantCountView> countByAuctionSessionIdsGrouped(
            @Param("auctionSessionIds") Collection<Long> auctionSessionIds);
}
