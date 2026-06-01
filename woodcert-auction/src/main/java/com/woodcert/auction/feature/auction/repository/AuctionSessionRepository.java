package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
public interface AuctionSessionRepository
                extends JpaRepository<AuctionSession, Long>, JpaSpecificationExecutor<AuctionSession> {

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

        /**
         * Lấy phiên của seller kèm product trong 1 query để tránh N+1.
         * countQuery tách biệt để Hibernate không áp dụng phân trang in-memory.
         */
        @Query(value = """
                        SELECT a FROM AuctionSession a
                        JOIN FETCH a.product
                        WHERE a.product.sellerId = :sellerId
                        """, countQuery = """
                        SELECT COUNT(a) FROM AuctionSession a
                        WHERE a.product.sellerId = :sellerId
                        """)
        Page<AuctionSession> findByProductSellerId(@Param("sellerId") String sellerId, Pageable pageable);

        /**
         * Lấy phiên của seller theo status kèm product trong 1 query để tránh N+1.
         * countQuery tách biệt để Hibernate không áp dụng phân trang in-memory.
         */
        @Query(value = """
                        SELECT a FROM AuctionSession a
                        JOIN FETCH a.product
                        WHERE a.product.sellerId = :sellerId
                          AND a.status = :status
                        """, countQuery = """
                        SELECT COUNT(a) FROM AuctionSession a
                        WHERE a.product.sellerId = :sellerId
                          AND a.status = :status
                        """)
        Page<AuctionSession> findByProductSellerIdAndStatus(
                        @Param("sellerId") String sellerId,
                        @Param("status") AuctionSessionStatus status,
                        Pageable pageable);

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

        @Query("""
                        SELECT DISTINCT a.id
                        FROM AuctionSession a
                        JOIN AuctionParticipant p
                          ON p.auctionSessionId = a.id
                        WHERE a.status IN :statuses
                          AND p.depositStatus = 'FROZEN'
                        ORDER BY a.id ASC
                        """)
        List<Long> findTerminalSessionIdsWithFrozenDeposits(
                        @Param("statuses") Collection<AuctionSessionStatus> statuses,
                        Pageable pageable);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Transactional
        @Query("""
                        UPDATE AuctionSession a
                        SET a.currentPrice = :newPrice,
                            a.highestBidderId = :highestBidderId,
                            a.endTime = :newEndTime
                        WHERE a.id = :auctionSessionId
                          AND (a.currentPrice IS NULL OR a.currentPrice <= :newPrice)
                        """)
        int updateRuntimeSnapshotIfNotStale(
                        @Param("auctionSessionId") Long auctionSessionId,
                        @Param("newPrice") java.math.BigDecimal newPrice,
                        @Param("highestBidderId") String highestBidderId,
                        @Param("newEndTime") Instant newEndTime);

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
                                List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE));
        }

        default Page<AuctionSession> findAllPublicAuctions(
                        Collection<AuctionSessionStatus> statuses,
                        Pageable pageable) {
                // Browse public chỉ mở một số trạng thái được phép hiển thị.
                return findByStatusIn(statuses, pageable);
        }

        /**
         * Đếm số phiên của seller gom theo trạng thái — dùng cho endpoint stats.
         * Trả về list [status, count] để tránh tạo thêm projection interface.
         */
        @Query("""
                        SELECT a.status, COUNT(a)
                        FROM AuctionSession a
                        WHERE a.product.sellerId = :sellerId
                        GROUP BY a.status
                        """)
        List<Object[]> countBySellerIdGroupByStatus(@Param("sellerId") String sellerId);

        @Query("""
                        SELECT DISTINCT a.product.material
                        FROM AuctionSession a
                        WHERE a.status IN :statuses
                          AND a.product.material IS NOT NULL
                        """)
        List<String> findDistinctMaterialsByStatusIn(@Param("statuses") Collection<AuctionSessionStatus> statuses);
}
