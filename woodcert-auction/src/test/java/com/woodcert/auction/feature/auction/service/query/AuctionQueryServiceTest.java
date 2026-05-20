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
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
    private AppraisalReportRepository appraisalReportRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SellerSummaryQueryService sellerSummaryQueryService;
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
                appraisalReportRepository,
                categoryRepository,
                sellerSummaryQueryService,
                productImageHelper,
                runtimeSnapshotService,
                responseAssembler,
                new AuctionPolicy());
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

        verify(responseAssembler).toDetailRes(session, product, null, List.of(), null, null, snapshot);
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
        product.setMaterial("Rosewood");
        product.setCategoryId(30);
        product.setSellerId("seller-1");
        return product;
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
