package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionSessionRepository extends JpaRepository<AuctionSession, Long> {

    List<AuctionSession> findByProductIdAndStatusIn(Long productId, Collection<AuctionSessionStatus> statuses);

    boolean existsByProductIdAndStatusIn(Long productId, Collection<AuctionSessionStatus> statuses);

    @Query("""
            SELECT a
            FROM AuctionSession a
            JOIN FETCH a.product
            WHERE a.id = :id
            """)
    Optional<AuctionSession> findByIdWithProduct(@Param("id") Long id);

    Page<AuctionSession> findByStatusIn(Collection<AuctionSessionStatus> statuses, Pageable pageable);

    Page<AuctionSession> findByProductSellerId(String sellerId, Pageable pageable);

    default boolean existsActiveOrWaitingByProductId(Long productId) {
        return existsByProductIdAndStatusIn(
                productId,
                List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE)
        );
    }

    default Page<AuctionSession> findAllPublicAuctions(
            Collection<AuctionSessionStatus> statuses,
            Pageable pageable) {
        return findByStatusIn(statuses, pageable);
    }
}
