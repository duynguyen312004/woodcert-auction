package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác dữ liệu phiên đấu giá.
 *
 * Command service dùng để đổi trạng thái phiên, query service dùng để lấy danh
 * sách/chi tiết, scheduler dùng để chuyển phiên giữa WAITING, ACTIVE và trạng
 * thái kết thúc.
 */
@Repository
public interface AuctionSessionRepository extends JpaRepository<AuctionSession, Long>, JpaSpecificationExecutor<AuctionSession> {

    /**
     * Kiểm tra sản phẩm đã có phiên sắp mở/đang chạy hay chưa.
     */
    List<AuctionSession> findByProductIdAndStatusIn(Long productId, Collection<AuctionSessionStatus> statuses);

    boolean existsByProductIdAndStatusIn(Long productId, Collection<AuctionSessionStatus> statuses);

    /**
     * Lấy kèm product để build response chi tiết.
     */
    @Query("""
            SELECT a
            FROM AuctionSession a
            JOIN FETCH a.product
            WHERE a.id = :id
            """)
    Optional<AuctionSession> findByIdWithProduct(@Param("id") Long id);

    /**
     * Khóa phiên và product khi command cần kiểm tra chủ sở hữu/trạng thái.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM AuctionSession a
            JOIN FETCH a.product
            WHERE a.id = :id
            """)
    Optional<AuctionSession> findByIdWithProductForUpdate(@Param("id") Long id);

    /**
     * Khóa nhẹ khi chỉ cần đổi dữ liệu của phiên.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM AuctionSession a
            WHERE a.id = :id
            """)
    Optional<AuctionSession> findByIdForUpdate(@Param("id") Long id);

    Page<AuctionSession> findByStatusIn(Collection<AuctionSessionStatus> statuses, Pageable pageable);

    Page<AuctionSession> findByProductSellerId(String sellerId, Pageable pageable);

    Page<AuctionSession> findByProductSellerIdAndStatus(String sellerId, AuctionSessionStatus status, Pageable pageable);

    /**
     * Scheduler dùng để tìm các phiên WAITING đã tới giờ bắt đầu.
     */
    @Query("""
            SELECT a.id
            FROM AuctionSession a
            WHERE a.status = 'WAITING'
              AND a.startTime <= :now
            """)
    List<Long> findDueWaitingSessionIds(@Param("now") Instant now);

    /**
     * Scheduler dùng để tìm các phiên ACTIVE đã quá giờ kết thúc.
     */
    @Query("""
            SELECT a.id
            FROM AuctionSession a
            WHERE a.status = 'ACTIVE'
              AND a.endTime <= :now
            """)
    List<Long> findDueActiveSessionIds(@Param("now") Instant now);

    /**
     * Giữ lại để bảo trì hoặc debug theo lô khi cần.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM AuctionSession a
            WHERE a.status = 'WAITING'
              AND a.startTime <= :now
            """)
    List<AuctionSession> findDueWaitingSessionsForUpdate(@Param("now") Instant now);

    /**
     * Giữ lại để bảo trì hoặc debug theo lô khi cần.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM AuctionSession a
            WHERE a.status = 'ACTIVE'
              AND a.endTime <= :now
            """)
    List<AuctionSession> findDueActiveSessionsForUpdate(@Param("now") Instant now);

    default boolean existsActiveOrWaitingByProductId(Long productId) {
        // Một sản phẩm chỉ được có một phiên sắp mở hoặc đang chạy.
        return existsByProductIdAndStatusIn(
                productId,
                List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE)
        );
    }

    default Page<AuctionSession> findAllPublicAuctions(
            Collection<AuctionSessionStatus> statuses,
            Pageable pageable) {
        // Browse public chỉ mở một số trạng thái được phép hiển thị.
        return findByStatusIn(statuses, pageable);
    }
}
