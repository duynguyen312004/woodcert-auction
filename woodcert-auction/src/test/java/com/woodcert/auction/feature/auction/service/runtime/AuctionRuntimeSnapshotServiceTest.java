package com.woodcert.auction.feature.auction.service.runtime;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionRuntimeSnapshotServiceTest {

    @Mock
    private AuctionRedisService auctionRedisService;

    @InjectMocks
    private AuctionRuntimeSnapshotService snapshotService;

    @Test
    void loadSnapshot_activeSession_readsPriceAndEndTimeFromRedis() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Instant endTime = Instant.ofEpochMilli(Instant.now().plusSeconds(120).toEpochMilli());
        when(auctionRedisService.getCurrentPrice(10L)).thenReturn("12500000");
        when(auctionRedisService.getEndTimeEpochMs(10L)).thenReturn(endTime.toEpochMilli());

        AuctionRuntimeSnapshot snapshot = snapshotService.loadSnapshot(session);

        assertThat(snapshot.currentPrice()).isEqualByComparingTo(new BigDecimal("12500000"));
        assertThat(snapshot.endTime()).isEqualTo(endTime);
    }

    @Test
    void loadSnapshot_missingRedisValues_returnsEmptySnapshotForDbFallback() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);

        AuctionRuntimeSnapshot snapshot = snapshotService.loadSnapshot(session);

        assertThat(snapshot.currentPrice()).isNull();
        assertThat(snapshot.endTime()).isNull();
    }

    @Test
    void loadSnapshot_waitingSessionDoesNotReadRedis() {
        AuctionRuntimeSnapshot snapshot = snapshotService.loadSnapshot(session(AuctionSessionStatus.WAITING));

        assertThat(snapshot.currentPrice()).isNull();
        assertThat(snapshot.endTime()).isNull();
    }

    private AuctionSession session(AuctionSessionStatus status) {
        AuctionSession session = new AuctionSession();
        session.setId(10L);
        session.setStatus(status);
        return session;
    }
}
