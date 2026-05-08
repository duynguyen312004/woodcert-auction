package com.woodcert.auction.feature.auction.service.query;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantCountView;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.service.assembler.AuctionResponseAssembler;
import com.woodcert.auction.feature.auction.service.policy.AuctionPolicy;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshotService;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionQueryServiceTest {

    private static final Long AUCTION_ID = 20L;
    private static final Long PRODUCT_ID = 10L;

    @Mock
    private AuctionSessionRepository auctionSessionRepository;
    @Mock
    private AuctionParticipantRepository auctionParticipantRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductImageHelper productImageHelper;
    @Mock
    private AuctionRuntimeSnapshotService runtimeSnapshotService;
    @Mock
    private AuctionResponseAssembler responseAssembler;

    private AuctionQueryService queryService;

    @BeforeEach
    void setUp() {
        queryService = new AuctionQueryService(
                auctionSessionRepository,
                auctionParticipantRepository,
                productRepository,
                productImageHelper,
                runtimeSnapshotService,
                responseAssembler,
                new AuctionPolicy());
    }

    @Test
    void getPublicAuctions_usesWaitingAndActiveAsDefaultStatuses() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        AuctionRuntimeSnapshot snapshot = AuctionRuntimeSnapshot.empty();
        AuctionListRes listRes = listRes();
        when(auctionSessionRepository.findAllPublicAuctions(anyCollection(), any()))
                .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
        when(productRepository.findAllById(List.of(PRODUCT_ID))).thenReturn(List.of(product));
        when(productImageHelper.batchLoadPrimaryImageUrls(anyCollection())).thenReturn(Map.of(PRODUCT_ID, "image-url"));
        when(auctionParticipantRepository.countByAuctionSessionIdsGrouped(List.of(AUCTION_ID)))
                .thenReturn(List.of(countView(AUCTION_ID, 3L)));
        when(runtimeSnapshotService.loadSnapshots(List.of(session))).thenReturn(Map.of(AUCTION_ID, snapshot));
        when(responseAssembler.toListRes(session, product, "image-url", 3L, snapshot)).thenReturn(listRes);

        var result = queryService.getPublicAuctions(1, 10, null);

        assertThat(result.result()).containsExactly(listRes);
        verify(auctionSessionRepository).findAllPublicAuctions(
                eq(List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE)),
                any());
        verify(auctionParticipantRepository).countByAuctionSessionIdsGrouped(List.of(AUCTION_ID));
    }

    @Test
    void getPublicAuctions_rejectsUnsupportedPublicStatus() {
        assertThatThrownBy(() -> queryService.getPublicAuctions(1, 10, "CANCELED"))
                .isInstanceOf(AppException.class);
    }

    @Test
    void getPublicAuctionDetail_passesRuntimeSnapshotToAssembler() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        AuctionRuntimeSnapshot snapshot = new AuctionRuntimeSnapshot(
                new BigDecimal("13000000"),
                Instant.now().plusSeconds(60));
        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(runtimeSnapshotService.loadSnapshot(session)).thenReturn(snapshot);

        queryService.getPublicAuctionDetail(AUCTION_ID);

        verify(responseAssembler).toDetailRes(session, product, snapshot);
    }

    @Test
    void getSellerAuctions_usesGroupedParticipantCounts() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        AuctionRuntimeSnapshot snapshot = new AuctionRuntimeSnapshot(
                new BigDecimal("13000000"),
                Instant.now().plusSeconds(60));
        when(auctionSessionRepository.findByProductSellerId(eq("seller-1"), any()))
                .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
        when(productRepository.findAllById(List.of(PRODUCT_ID))).thenReturn(List.of(product));
        when(auctionParticipantRepository.countByAuctionSessionIdsGrouped(List.of(AUCTION_ID)))
                .thenReturn(List.of(countView(AUCTION_ID, 5L)));
        when(runtimeSnapshotService.loadSnapshots(List.of(session))).thenReturn(Map.of(AUCTION_ID, snapshot));

        queryService.getSellerAuctions("seller-1", 1, 10);

        ArgumentCaptor<AuctionRuntimeSnapshot> snapshotCaptor = ArgumentCaptor.forClass(AuctionRuntimeSnapshot.class);
        verify(responseAssembler).toSellerListRes(eq(session), eq("Wood statue"), eq(5L), snapshotCaptor.capture());
        assertThat(snapshotCaptor.getValue()).isSameAs(snapshot);
        verify(auctionParticipantRepository).countByAuctionSessionIdsGrouped(List.of(AUCTION_ID));
    }

    private AuctionSession session(AuctionSessionStatus status) {
        AuctionSession session = new AuctionSession();
        session.setId(AUCTION_ID);
        session.setProductId(PRODUCT_ID);
        session.setStartingPrice(new BigDecimal("10000000"));
        session.setCurrentPrice(new BigDecimal("10000000"));
        session.setDepositAmount(new BigDecimal("1000000"));
        session.setStartTime(Instant.now().plusSeconds(3600));
        session.setEndTime(Instant.now().plusSeconds(7200));
        session.setStatus(status);
        return session;
    }

    private Product product() {
        Product product = new Product();
        product.setId(PRODUCT_ID);
        product.setTitle("Wood statue");
        return product;
    }

    private AuctionListRes listRes() {
        return new AuctionListRes(
                AUCTION_ID,
                null,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                Instant.now(),
                Instant.now(),
                AuctionSessionStatus.WAITING,
                0);
    }

    private AuctionParticipantCountView countView(Long auctionSessionId, long participantCount) {
        return new AuctionParticipantCountView() {
            @Override
            public Long getAuctionSessionId() {
                return auctionSessionId;
            }

            @Override
            public long getParticipantCount() {
                return participantCount;
            }
        };
    }
}
