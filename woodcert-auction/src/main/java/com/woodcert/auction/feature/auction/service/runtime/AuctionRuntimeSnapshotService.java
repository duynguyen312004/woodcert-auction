package com.woodcert.auction.feature.auction.service.runtime;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuctionRuntimeSnapshotService {

    private final AuctionRedisService auctionRedisService;

    public Map<Long, AuctionRuntimeSnapshot> loadSnapshots(Collection<AuctionSession> sessions) {
        Map<Long, AuctionRuntimeSnapshot> snapshots = new LinkedHashMap<>();
        if (sessions == null || sessions.isEmpty()) {
            return snapshots;
        }

        for (AuctionSession session : sessions) {
            snapshots.put(session.getId(), loadSnapshot(session));
        }
        return snapshots;
    }

    public AuctionRuntimeSnapshot loadSnapshot(AuctionSession session) {
        if (session == null || session.getStatus() != AuctionSessionStatus.ACTIVE) {
            return AuctionRuntimeSnapshot.empty();
        }

        BigDecimal currentPrice = parsePrice(auctionRedisService.getCurrentPrice(session.getId()));
        Instant endTime = parseEndTime(auctionRedisService.getEndTimeEpochMs(session.getId()));
        return new AuctionRuntimeSnapshot(currentPrice, endTime);
    }

    private BigDecimal parsePrice(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Instant parseEndTime(Long epochMillis) {
        return epochMillis != null && epochMillis > 0 ? Instant.ofEpochMilli(epochMillis) : null;
    }
}
