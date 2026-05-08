package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.Bid;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Secondary persistence for bid rows.
 * Must NOT affect the bid API response or broadcast — failures are logged and swallowed.
 * Duplicate bidTraceId inserts are no-ops (unique constraint violation caught and ignored).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BidPersistenceService {

    private final BidRepository bidRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveBid(String bidTraceId, Long auctionSessionId, String userId,
                        BigDecimal bidAmount, BidStatus status, Instant bidTime) {
        try {
            if (bidRepository.existsByBidTraceId(bidTraceId)) {
                return; // no-op for duplicates
            }
            Bid bid = new Bid();
            bid.setBidTraceId(bidTraceId);
            bid.setAuctionSessionId(auctionSessionId);
            bid.setUserId(userId);
            bid.setBidAmount(bidAmount);
            bid.setStatus(status);
            bid.setBidTime(bidTime);
            bidRepository.save(bid);
        } catch (DataIntegrityViolationException e) {
            log.debug("Duplicate bidTraceId {} — ignoring", bidTraceId);
        } catch (Exception e) {
            log.warn("Failed to persist bid {} for session {}: {}", bidTraceId, auctionSessionId, e.getMessage());
        }
    }
}
