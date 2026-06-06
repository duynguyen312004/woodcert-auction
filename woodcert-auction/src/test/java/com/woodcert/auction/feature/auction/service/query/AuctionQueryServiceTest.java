package com.woodcert.auction.feature.auction.service.query;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.MyParticipationRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.Bid;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionDepositStatusCountView;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantCountView;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.repository.BidRepository;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.auction.service.assembler.AuctionResponseAssembler;
import com.woodcert.auction.feature.auction.service.policy.AuctionPolicy;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshotService;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

/**
 * Test unit cho phần đọc dữ liệu đấu giá.
 *
 * Bao phủ kiểm tra filter/trạng thái, ghép dữ liệu danh sách public, đếm người
 * tham gia ở danh sách seller và truyền dữ liệu runtime vào assembler.
 */
@ExtendWith(MockitoExtension.class)
class AuctionQueryServiceTest {

    private static final Long AUCTION_ID = 20L;
    private static final Long PRODUCT_ID = 10L;

    @Mock
    private AuctionSessionRepository auctionSessionRepository;
    @Mock
    private AuctionParticipantRepository auctionParticipantRepository;
    @Mock
    private BidRepository bidRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private AppraisalReportRepository appraisalReportRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SellerSummaryQueryService sellerSummaryQueryService;
    @Mock
    private ProductImageHelper productImageHelper;
    @Mock
    private AuctionRedisService auctionRedisService;
    @Mock
    private AuctionRuntimeSnapshotService runtimeSnapshotService;
    @Mock
    private AuctionResponseAssembler responseAssembler;
    @Mock
    private OrderService orderService;

    private AuctionQueryService queryService;

    @BeforeEach
    void setUp() {
        queryService = new AuctionQueryService(
                auctionSessionRepository,
                auctionParticipantRepository,
                bidRepository,
                productRepository,
                appraisalReportRepository,
                categoryRepository,
                sellerSummaryQueryService,
                productImageHelper,
                auctionRedisService,
                runtimeSnapshotService,
                responseAssembler,
                new AuctionPolicy(),
                orderService);
        lenient().when(orderService.findSummaryBySource(eq(OrderSourceType.AUCTION), anyLong())).thenReturn(null);
    }

    @Test
    void getPublicAuctions_usesWaitingAndActiveAsDefaultStatuses() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        AppraisalReport appraisalReport = appraisalReport();
        Category category = category();
        SellerSummaryQueryService.SellerSummary seller = seller();
        AuctionRuntimeSnapshot snapshot = AuctionRuntimeSnapshot.empty();
        AuctionListRes listRes = listRes();

        when(auctionSessionRepository.findAllPublicAuctions(anyCollection(), any()))
                .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
        when(productRepository.findAllById(List.of(PRODUCT_ID))).thenReturn(List.of(product));
        when(productImageHelper.batchLoadPrimaryImageUrls(anyCollection())).thenReturn(Map.of(PRODUCT_ID, "image-url"));
        when(appraisalReportRepository.findByProductIdIn(List.of(PRODUCT_ID))).thenReturn(List.of(appraisalReport));
        when(categoryRepository.findAllById(List.of(30))).thenReturn(List.of(category));
        when(sellerSummaryQueryService.findSellerSummaries(List.of("seller-1")))
                .thenReturn(Map.of("seller-1", seller));
        when(auctionParticipantRepository.countByAuctionSessionIdsGrouped(List.of(AUCTION_ID)))
                .thenReturn(List.of(countView(AUCTION_ID, 3L)));
        when(runtimeSnapshotService.loadSnapshots(List.of(session))).thenReturn(Map.of(AUCTION_ID, snapshot));
        when(responseAssembler.toListRes(
                session,
                product,
                "image-url",
                "Wood sculpture",
                appraisalReport,
                seller,
                3L,
                snapshot)).thenReturn(listRes);

        var result = queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                1, 10, null, null, null, null, null));

        assertThat(result.result()).containsExactly(listRes);
        verify(auctionSessionRepository).findAllPublicAuctions(
                eq(List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE)),
                any());
        verify(auctionParticipantRepository).countByAuctionSessionIdsGrouped(List.of(AUCTION_ID));
        verify(appraisalReportRepository).findByProductIdIn(List.of(PRODUCT_ID));
        verify(categoryRepository).findAllById(List.of(30));
        verify(sellerSummaryQueryService).findSellerSummaries(List.of("seller-1"));
    }

    @Test
    void getPublicAuctions_rejectsUnsupportedPublicStatus() {
        assertThatThrownBy(() -> queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                1, 10, "CANCELED", null, null, null, null)))
                .isInstanceOf(AppException.class);
    }

    @Test
    void getPublicAuctions_rejectsInvalidPriceRange() {
        assertThatThrownBy(() -> queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                1, 10, null, null, null,
                new BigDecimal("5000000"), new BigDecimal("1000000"))))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("priceMin");
    }

    @Test
    void getPublicAuctions_unknownCategoryReturnsEmptyPage() {
        when(categoryRepository.findByNameIgnoreCase("Missing")).thenReturn(Optional.empty());

        var result = queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                1, 10, null, null, "Missing", null, null));

        assertThat(result.result()).isEmpty();
        assertThat(result.meta().total()).isZero();
        verify(auctionSessionRepository, never()).findAllPublicAuctions(anyCollection(), any());
        verify(auctionSessionRepository, never()).findAll(ArgumentMatchers.<Specification<AuctionSession>>any(), any(Pageable.class));
    }

    @Test
    void getPublicAuctions_usesSpecificationWhenFilterPresent() {
        when(categoryRepository.findByNameIgnoreCase("Wood sculpture")).thenReturn(Optional.of(category()));
        when(auctionSessionRepository.findAll(ArgumentMatchers.<Specification<AuctionSession>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));
        when(productImageHelper.batchLoadPrimaryImageUrls(anyCollection())).thenReturn(Map.of());
        when(runtimeSnapshotService.loadSnapshots(List.of())).thenReturn(Map.of());
        when(sellerSummaryQueryService.findSellerSummaries(List.of())).thenReturn(Map.of());

        var result = queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                1, 10, "WAITING", "rosewood", "Wood sculpture",
                new BigDecimal("1000000"), new BigDecimal("5000000")));

        assertThat(result.result()).isEmpty();
        verify(auctionSessionRepository).findAll(ArgumentMatchers.<Specification<AuctionSession>>any(), any(Pageable.class));
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
        when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.empty());
        when(sellerSummaryQueryService.findSellerSummary("seller-1")).thenReturn(Optional.empty());
        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn(null);
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of());
        when(runtimeSnapshotService.loadSnapshot(session)).thenReturn(snapshot);

        queryService.getPublicAuctionDetail(AUCTION_ID);

        verify(responseAssembler).toDetailRes(session, product, null, List.of(), null, null, snapshot, null);
    }

    @Test
    void getMyParticipation_returnsSellerOwnedContext() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        session.setProduct(product);
        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "seller-1"))
                .thenReturn(Optional.empty());

        MyParticipationRes result = queryService.getMyParticipation("seller-1", AUCTION_ID);

        assertThat(result.sellerOwned()).isTrue();
        assertThat(result.registered()).isFalse();
        assertThat(result.canRegister()).isFalse();
        assertThat(result.canWithdraw()).isFalse();
        assertThat(result.canBid()).isFalse();
        assertThat(result.reasonCode()).isEqualTo("SELLER_OWN_AUCTION");
        assertThat(result.depositAmount()).isEqualByComparingTo("1000000");
    }

    @Test
    void getMyParticipation_returnsCanBidForFrozenParticipantInActiveRuntime() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.FROZEN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID))
                .thenReturn(Instant.now().plusSeconds(60).toEpochMilli());

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.sellerOwned()).isFalse();
        assertThat(result.registered()).isTrue();
        assertThat(result.depositStatus()).isEqualTo(DepositStatus.FROZEN);
        assertThat(result.canRegister()).isFalse();
        assertThat(result.canWithdraw()).isFalse();
        assertThat(result.canBid()).isTrue();
        assertThat(result.reasonCode()).isEqualTo("CAN_BID");
    }

    @Test
    void getMyParticipation_blocksCurrentHighestBidder() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.FROZEN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID))
                .thenReturn(Instant.now().plusSeconds(60).toEpochMilli());
        when(auctionRedisService.getHighestBidderId(AUCTION_ID)).thenReturn("bidder-1");

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.highestBidder()).isTrue();
        assertThat(result.canBid()).isFalse();
        assertThat(result.reasonCode()).isEqualTo("CURRENT_HIGHEST_BIDDER");
    }

    @Test
    void getMyParticipation_allowsWithdrawalForWaitingFrozenParticipant() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.FROZEN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.canWithdraw()).isTrue();
        assertThat(result.canRegister()).isFalse();
        assertThat(result.canBid()).isFalse();
        assertThat(result.reasonCode()).isEqualTo("WAITING_FOR_ACTIVATION");
    }

    @Test
    void getMyParticipation_returnsWithdrawnContext() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.WITHDRAWN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.registered()).isTrue();
        assertThat(result.depositStatus()).isEqualTo(DepositStatus.WITHDRAWN);
        assertThat(result.canRegister()).isFalse();
        assertThat(result.canWithdraw()).isFalse();
        assertThat(result.outcomeCode()).isEqualTo("WITHDRAWN");
    }

    @Test
    void getMyParticipation_blocksActiveRuntimeMissing() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.empty());
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID)).thenReturn(null);

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.registered()).isFalse();
        assertThat(result.canRegister()).isFalse();
        assertThat(result.canBid()).isFalse();
        assertThat(result.reasonCode()).isEqualTo("AUCTION_RUNTIME_UNAVAILABLE");
    }

    @Test
    void getMyParticipation_returnsWinnerOutcome() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_SUCCESS);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.DEDUCTED);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.winner()).isTrue();
        assertThat(result.outcomeCode()).isEqualTo("WINNER");
    }

    @Test
    void getMyParticipation_returnsLoserOutcome() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_SUCCESS);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.REFUNDED);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.winner()).isFalse();
        assertThat(result.outcomeCode()).isEqualTo("LOSER");
    }

    @Test
    void getMyParticipation_returnsEndedFailedOutcome() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_FAILED);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.FROZEN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.outcomeCode()).isEqualTo("ENDED_FAILED");
    }

    @Test
    void getMyParticipation_returnsPendingSettlementOutcome() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_SUCCESS);
        Product product = product();
        session.setProduct(product);
        AuctionParticipant participant = participant("bidder-1", DepositStatus.FROZEN);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.of(participant));

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.outcomeCode()).isEqualTo("PENDING_SETTLEMENT");
    }

    @Test
    void getMyParticipation_returnsNotParticipatedOutcome() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_SUCCESS);
        Product product = product();
        session.setProduct(product);

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, "bidder-1"))
                .thenReturn(Optional.empty());

        MyParticipationRes result = queryService.getMyParticipation("bidder-1", AUCTION_ID);

        assertThat(result.outcomeCode()).isEqualTo("NOT_PARTICIPATED");
    }

    @Test
    void getBidHistory_returnsValidBidsMaskedAndMineFlag() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Bid ownBid = bid("trace-1", "bidder-12345", new BigDecimal("12000000.00"));
        Bid otherBid = bid("trace-2", "other-12345", new BigDecimal("11000000.00"));
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        when(auctionSessionRepository.findById(AUCTION_ID)).thenReturn(Optional.of(session));
        when(bidRepository.findByAuctionSessionIdAndStatusOrderByBidTimeDesc(
                eq(AUCTION_ID), eq(BidStatus.VALID), pageableCaptor.capture()))
                .thenReturn(List.of(ownBid, otherBid));

        var result = queryService.getBidHistory(AUCTION_ID, 100, "bidder-12345");

        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(50);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).bidTraceId()).isEqualTo("trace-1");
        assertThat(result.get(0).bidderMaskedAlias()).isEqualTo("bidd****");
        assertThat(result.get(0).mine()).isTrue();
        assertThat(result.get(1).bidderMaskedAlias()).isEqualTo("othe****");
        assertThat(result.get(1).mine()).isFalse();
    }

    @Test
    void getSellerAuctions_usesGroupedParticipantCounts() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        AuctionRuntimeSnapshot snapshot = new AuctionRuntimeSnapshot(
                new BigDecimal("13000000"),
                Instant.now().plusSeconds(60));
        when(auctionSessionRepository.findByProductSellerId(eq("seller-1"), any()))
                .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
        when(productImageHelper.batchLoadPrimaryImageUrls(anyCollection()))
                .thenReturn(Map.of(PRODUCT_ID, "image-url"));
        when(auctionParticipantRepository.countByAuctionSessionIdsGrouped(List.of(AUCTION_ID)))
                .thenReturn(List.of(countView(AUCTION_ID, 5L)));
        when(runtimeSnapshotService.loadSnapshots(List.of(session))).thenReturn(Map.of(AUCTION_ID, snapshot));

        queryService.getSellerAuctions("seller-1", 1, 10, null);

        ArgumentCaptor<AuctionRuntimeSnapshot> snapshotCaptor = ArgumentCaptor.forClass(AuctionRuntimeSnapshot.class);
        verify(responseAssembler).toSellerListRes(eq(session), eq("Wood statue"), eq("image-url"), eq(5L), snapshotCaptor.capture());
        assertThat(snapshotCaptor.getValue()).isSameAs(snapshot);
        verify(auctionParticipantRepository).countByAuctionSessionIdsGrouped(List.of(AUCTION_ID));
    }

    @Test
    void getSellerAuctions_filtersByStatusWhenProvided() {
        when(auctionSessionRepository.findByProductSellerIdAndStatus(eq("seller-1"), eq(AuctionSessionStatus.ACTIVE), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));
        when(runtimeSnapshotService.loadSnapshots(List.of())).thenReturn(Map.of());

        var result = queryService.getSellerAuctions("seller-1", 1, 10, "ACTIVE");

        assertThat(result.result()).isEmpty();
        verify(auctionSessionRepository).findByProductSellerIdAndStatus(
                eq("seller-1"),
                eq(AuctionSessionStatus.ACTIVE),
                any());
        verify(auctionSessionRepository, never()).findByProductSellerId(eq("seller-1"), any());
    }

    @Test
    void getSellerAuctionDetail_returnsOwnerDetailWithRuntimeSnapshot() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        Product product = product();
        session.setProduct(product);
        AuctionRuntimeSnapshot snapshot = new AuctionRuntimeSnapshot(
                new BigDecimal("14000000"),
                Instant.now().plusSeconds(300));
        SellerAuctionDetailRes expected = sellerDetailRes();

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.empty());
        when(runtimeSnapshotService.loadSnapshot(session)).thenReturn(snapshot);
        when(auctionParticipantRepository.countDepositStatusByAuctionSessionId(AUCTION_ID))
                .thenReturn(List.of(depositCountView(DepositStatus.FROZEN, 2L)));
        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn("image-url");
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of("image-url"));
        when(responseAssembler.toSellerDetailRes(
                eq(session),
                eq(product),
                eq("image-url"),
                eq(List.of("image-url")),
                eq(null),
                eq(2L),
                any(),
                eq(SellerAuctionDetailRes.SellerAuctionSettlementStatus.NOT_APPLICABLE),
                eq(null),
                eq(null),
                eq(snapshot))).thenReturn(expected);

        SellerAuctionDetailRes result = queryService.getSellerAuctionDetail("seller-1", AUCTION_ID);

        assertThat(result).isSameAs(expected);
        verify(responseAssembler).toSellerDetailRes(
                eq(session),
                eq(product),
                eq("image-url"),
                eq(List.of("image-url")),
                eq(null),
                eq(2L),
                any(),
                eq(SellerAuctionDetailRes.SellerAuctionSettlementStatus.NOT_APPLICABLE),
                eq(null),
                eq(null),
                eq(snapshot));
    }

    @Test
    void getSellerAuctionDetail_rejectsNonOwner() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        Product product = product();
        session.setProduct(product);
        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> queryService.getSellerAuctionDetail("other-seller", AUCTION_ID))
                .isInstanceOf(AppException.class);

        verify(auctionParticipantRepository, never()).countDepositStatusByAuctionSessionId(any());
    }

    @Test
    void getSellerAuctionDetail_marksTerminalSettlementPendingAndMasksWinner() {
        AuctionSession session = session(AuctionSessionStatus.ENDED_SUCCESS);
        session.setHighestBidderId("winner-123");
        Product product = product();
        session.setProduct(product);
        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.empty());
        when(runtimeSnapshotService.loadSnapshot(session)).thenReturn(AuctionRuntimeSnapshot.empty());
        when(auctionParticipantRepository.countDepositStatusByAuctionSessionId(AUCTION_ID))
                .thenReturn(List.of(
                        depositCountView(DepositStatus.FROZEN, 1L),
                        depositCountView(DepositStatus.DEDUCTED, 1L),
                        depositCountView(DepositStatus.REFUNDED, 2L)));
        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn(null);
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of());

        queryService.getSellerAuctionDetail("seller-1", AUCTION_ID);

        verify(responseAssembler).toSellerDetailRes(
                eq(session),
                eq(product),
                eq(null),
                eq(List.of()),
                eq(null),
                eq(4L),
                any(),
                eq(SellerAuctionDetailRes.SellerAuctionSettlementStatus.PENDING),
                eq("winn****"),
                eq(null),
                eq(AuctionRuntimeSnapshot.empty()));
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
        product.setMaterial("Rosewood");
        product.setCategoryId(30);
        product.setSellerId("seller-1");
        return product;
    }

    private AuctionParticipant participant(String userId, DepositStatus depositStatus) {
        AuctionParticipant participant = new AuctionParticipant();
        participant.setAuctionSessionId(AUCTION_ID);
        participant.setUserId(userId);
        participant.setDepositAmount(new BigDecimal("1000000"));
        participant.setDepositStatus(depositStatus);
        return participant;
    }

    private Bid bid(String traceId, String userId, BigDecimal amount) {
        Bid bid = new Bid();
        bid.setBidTraceId(traceId);
        bid.setAuctionSessionId(AUCTION_ID);
        bid.setUserId(userId);
        bid.setBidAmount(amount);
        bid.setStatus(BidStatus.VALID);
        bid.setBidTime(Instant.now());
        return bid;
    }

    private AppraisalReport appraisalReport() {
        AppraisalReport report = new AppraisalReport();
        report.setProductId(PRODUCT_ID);
        report.setVerifiedMaterial("Verified rosewood");
        report.setAuthentic(true);
        return report;
    }

    private Category category() {
        Category category = new Category();
        category.setId(30);
        category.setName("Wood sculpture");
        return category;
    }

    private SellerSummaryQueryService.SellerSummary seller() {
        return new SellerSummaryQueryService.SellerSummary("Wood Store", new BigDecimal("4.80"));
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
                0,
                null);
    }

    private SellerAuctionDetailRes sellerDetailRes() {
        return new SellerAuctionDetailRes(
                AUCTION_ID,
                AuctionSessionStatus.ACTIVE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                null,
                Instant.now(),
                Instant.now(),
                2,
                null,
                SellerAuctionDetailRes.SellerAuctionSettlementStatus.NOT_APPLICABLE,
                new SellerAuctionDetailRes.SettlementSummary(2, 0, 0, 0, 0),
                null,
                null,
                Instant.now(),
                Instant.now());
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

    private AuctionDepositStatusCountView depositCountView(DepositStatus status, long participantCount) {
        return new AuctionDepositStatusCountView() {
            @Override
            public DepositStatus getDepositStatus() {
                return status;
            }

            @Override
            public long getParticipantCount() {
                return participantCount;
            }
        };
    }
}
