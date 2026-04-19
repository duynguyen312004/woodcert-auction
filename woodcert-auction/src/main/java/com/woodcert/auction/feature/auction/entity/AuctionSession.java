package com.woodcert.auction.feature.auction.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import com.woodcert.auction.feature.catalog.entity.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Auction session entity â€” maps to 'auction_sessions' table.
 * Tracks the DB snapshot and lifecycle of a product auction.
 */
@Getter
@Setter
@Entity
@Table(name = "auction_sessions", indexes = {
        @Index(name = "idx_auction_sessions_product_id", columnList = "product_id"),
        @Index(name = "idx_auction_sessions_status", columnList = "status"),
        @Index(name = "idx_auction_sessions_end_time", columnList = "end_time"),
        @Index(name = "idx_auction_sessions_status_end_time", columnList = "status,end_time")
})
public class AuctionSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "starting_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal startingPrice;

    @Column(name = "reserve_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal reservePrice;

    @Column(name = "step_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal stepPrice;

    @Column(name = "deposit_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "current_price", precision = 19, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "highest_bidder_id", length = 36)
    private String highestBidderId;

    @Column(name = "winner_bid_id")
    private Long winnerBidId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AuctionSessionStatus status;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
}
