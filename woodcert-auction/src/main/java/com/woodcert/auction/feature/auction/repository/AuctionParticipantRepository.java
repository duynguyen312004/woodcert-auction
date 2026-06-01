package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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
            SELECT p.id
            FROM AuctionParticipant p
            WHERE p.auctionSessionId = :auctionSessionId
              AND p.depositStatus = :depositStatus
            ORDER BY p.id ASC
            """)
    List<Long> findIdsByAuctionSessionIdAndDepositStatus(
            @Param("auctionSessionId") Long auctionSessionId,
            @Param("depositStatus") DepositStatus depositStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM AuctionParticipant p
            WHERE p.id = :id
              AND p.depositStatus = :depositStatus
            """)
    Optional<AuctionParticipant> findByIdAndDepositStatusForUpdate(
            @Param("id") Long id,
            @Param("depositStatus") DepositStatus depositStatus);

    @Query("""
            SELECT p.depositStatus AS depositStatus,
                   COUNT(p.id) AS participantCount
            FROM AuctionParticipant p
            WHERE p.auctionSessionId = :auctionSessionId
            GROUP BY p.depositStatus
            """)
    List<AuctionDepositStatusCountView> countDepositStatusByAuctionSessionId(
            @Param("auctionSessionId") Long auctionSessionId);

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
