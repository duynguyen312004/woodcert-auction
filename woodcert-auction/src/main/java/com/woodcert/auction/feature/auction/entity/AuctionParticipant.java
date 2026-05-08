package com.woodcert.auction.feature.auction.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A registered participant in an auction session.
 * One row per (auctionSessionId, userId) — enforced by unique constraint.
 * Only participants with depositStatus = FROZEN are allowed to bid.
 */
@Getter
@Setter
@Entity
@Table(name = "auction_participants", indexes = {
        @Index(name = "uq_auction_participants_user_session",
                columnList = "auction_session_id,user_id", unique = true),
        @Index(name = "idx_auction_participants_session_id", columnList = "auction_session_id")
})
public class AuctionParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auction_session_id", nullable = false)
    private Long auctionSessionId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "deposit_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_status", nullable = false, length = 20)
    private DepositStatus depositStatus;

    @CreationTimestamp
    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;
}
