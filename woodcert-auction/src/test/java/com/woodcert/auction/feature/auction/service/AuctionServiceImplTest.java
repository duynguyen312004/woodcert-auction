package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuctionServiceImplTest {

    @Mock private AuctionSessionRepository auctionSessionRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private AppraisalReportRepository appraisalReportRepository;
    @Mock private SellerProfileRepository sellerProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductImageHelper productImageHelper;

    @InjectMocks
    private AuctionServiceImpl auctionService;

    private static final String SELLER_ID = "seller-uuid-001";
    private static final String OTHER_SELLER_ID = "seller-uuid-999";
    private static final Long PRODUCT_ID = 10L;
    private static final Long AUCTION_ID = 20L;

    private static void assertAppException(Runnable action, ErrorCode expected) {
        assertThatThrownBy(action::run)
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getStatusCode()).isEqualTo(expected.getStatusCode());
                    assertThat(exception.getMessage()).isEqualTo(expected.getMessage());
                });
    }

    private Product createProduct(ProductStatus status) {
        Product product = new Product();
        product.setId(PRODUCT_ID);
        product.setSellerId(SELLER_ID);
        product.setTitle("Tượng Gỗ Trắc");
        product.setMaterial("Seller material");
        product.setStatus(status);
        return product;
    }

    private User createSeller() {
        User seller = new User();
        seller.setId(SELLER_ID);
        seller.setFullName("Xưởng Gỗ ABC");
        return seller;
    }

    private SellerProfile createSellerProfile() {
        SellerProfile profile = new SellerProfile();
        profile.setUserId(SELLER_ID);
        profile.setStoreName("Xưởng Gỗ ABC");
        profile.setReputationScore(new BigDecimal("4.80"));
        return profile;
    }

    private AppraisalReport createAppraisal() {
        AppraisalReport appraisalReport = new AppraisalReport();
        appraisalReport.setProductId(PRODUCT_ID);
        appraisalReport.setVerifiedMaterial("Gỗ Trắc Đỏ");
        appraisalReport.setCertificateCode("CERT-2026-00001");
        appraisalReport.setAuthentic(true);
        appraisalReport.setEstimatedValue(new BigDecimal("15000000"));
        return appraisalReport;
    }

    private AuctionSession createAuctionSession(AuctionSessionStatus status) {
        AuctionSession session = new AuctionSession();
        session.setId(AUCTION_ID);
        session.setProductId(PRODUCT_ID);
        session.setStartingPrice(new BigDecimal("10000000"));
        session.setReservePrice(new BigDecimal("12000000"));
        session.setStepPrice(new BigDecimal("100000"));
        session.setDepositAmount(new BigDecimal("1000000"));
        session.setCurrentPrice(new BigDecimal("10000000"));
        session.setStartTime(Instant.parse("2026-05-01T10:00:00Z"));
        session.setEndTime(Instant.parse("2026-05-01T12:00:00Z"));
        session.setStatus(status);
        return session;
    }

    private CreateAuctionSessionReq validRequest() {
        return new CreateAuctionSessionReq(
                PRODUCT_ID,
                new BigDecimal("10000000"),
                new BigDecimal("12000000"),
                new BigDecimal("100000"),
                new BigDecimal("1000000"),
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200)
        );
    }

    @Nested
    @DisplayName("createAuctionSession")
    class CreateAuctionSession {

        @Test
        @DisplayName("should create WAITING auction for owned APPRAISED product")
        void createAuctionSession_success() {
            Product product = createProduct(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(false);
            when(auctionSessionRepository.save(any(AuctionSession.class))).thenAnswer(invocation -> {
                AuctionSession session = invocation.getArgument(0);
                session.setId(AUCTION_ID);
                return session;
            });
            when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID)).thenReturn(List.of());
            when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.of(createAppraisal()));
            when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(createSeller()));
            when(sellerProfileRepository.findById(SELLER_ID)).thenReturn(Optional.of(createSellerProfile()));

            AuctionDetailRes result = auctionService.createAuctionSession(SELLER_ID, validRequest());

            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(AUCTION_ID);
            assertThat(result.status()).isEqualTo(AuctionSessionStatus.WAITING);
            assertThat(result.currentPrice()).isEqualByComparingTo("10000000");
            assertThat(result.product().material()).isEqualTo("Gỗ Trắc Đỏ");
            assertThat(result.seller().storeName()).isEqualTo("Xưởng Gỗ ABC");
        }

        @Test
        @DisplayName("should reject non-owned product")
        void createAuctionSession_notOwned_throws() {
            Product product = createProduct(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> auctionService.createAuctionSession(OTHER_SELLER_ID, validRequest()),
                    ErrorCode.AUCTION_PRODUCT_NOT_OWNED
            );
        }

        @Test
        @DisplayName("should reject non-appraised product")
        void createAuctionSession_notAppraised_throws() {
            Product product = createProduct(ProductStatus.DRAFT);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> auctionService.createAuctionSession(SELLER_ID, validRequest()),
                    ErrorCode.AUCTION_PRODUCT_NOT_APPRAISED
            );
        }

        @Test
        @DisplayName("should reject product with existing waiting or active auction")
        void createAuctionSession_conflict_throws() {
            Product product = createProduct(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(true);

            assertAppException(
                    () -> auctionService.createAuctionSession(SELLER_ID, validRequest()),
                    ErrorCode.AUCTION_SESSION_CONFLICT
            );
        }

        @Test
        @DisplayName("should reject reserve price lower than starting price")
        void createAuctionSession_reserveTooLow_throws() {
            Product product = createProduct(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(false);

            CreateAuctionSessionReq request = new CreateAuctionSessionReq(
                    PRODUCT_ID,
                    new BigDecimal("10000000"),
                    new BigDecimal("9000000"),
                    new BigDecimal("100000"),
                    new BigDecimal("1000000"),
                    Instant.now().plusSeconds(3600),
                    Instant.now().plusSeconds(7200)
            );

            assertAppException(
                    () -> auctionService.createAuctionSession(SELLER_ID, request),
                    ErrorCode.AUCTION_RESERVE_PRICE_INVALID
            );
        }

        @Test
        @DisplayName("should reject deposit greater than 50 percent of starting price")
        void createAuctionSession_depositTooHigh_throws() {
            Product product = createProduct(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(false);

            CreateAuctionSessionReq request = new CreateAuctionSessionReq(
                    PRODUCT_ID,
                    new BigDecimal("10000000"),
                    new BigDecimal("12000000"),
                    new BigDecimal("100000"),
                    new BigDecimal("6000000"),
                    Instant.now().plusSeconds(3600),
                    Instant.now().plusSeconds(7200)
            );

            assertAppException(
                    () -> auctionService.createAuctionSession(SELLER_ID, request),
                    ErrorCode.AUCTION_DEPOSIT_AMOUNT_INVALID
            );
        }
    }

    @Nested
    @DisplayName("cancelAuctionSession")
    class CancelAuctionSession {

        @Test
        @DisplayName("should cancel waiting auction owned by seller")
        void cancelAuctionSession_success() {
            AuctionSession session = createAuctionSession(AuctionSessionStatus.WAITING);
            session.setProduct(createProduct(ProductStatus.APPRAISED));
            when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));

            auctionService.cancelAuctionSession(SELLER_ID, AUCTION_ID);

            assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.CANCELED);
        }

        @Test
        @DisplayName("should reject cancel when auction is active")
        void cancelAuctionSession_notWaiting_throws() {
            AuctionSession session = createAuctionSession(AuctionSessionStatus.ACTIVE);
            session.setProduct(createProduct(ProductStatus.APPRAISED));
            when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));

            assertAppException(
                    () -> auctionService.cancelAuctionSession(SELLER_ID, AUCTION_ID),
                    ErrorCode.AUCTION_SESSION_NOT_CANCELABLE
            );
        }
    }

    @Nested
    @DisplayName("getPublicAuctions")
    class GetPublicAuctions {

        @Test
        @DisplayName("should use WAITING and ACTIVE as default public statuses")
        void getPublicAuctions_defaultStatuses() {
            Product product = createProduct(ProductStatus.APPRAISED);
            AuctionSession session = createAuctionSession(AuctionSessionStatus.WAITING);
            when(auctionSessionRepository.findAllPublicAuctions(anyCollection(), any()))
                    .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
            when(productRepository.findAllById(List.of(PRODUCT_ID))).thenReturn(List.of(product));
            when(productImageHelper.batchLoadPrimaryImageUrls(anyCollection())).thenReturn(Map.of(PRODUCT_ID, "image-url"));

            var result = auctionService.getPublicAuctions(1, 10, null);

            assertThat(result.result()).hasSize(1);
            assertThat(result.result().get(0).product().title()).isEqualTo("Tượng Gỗ Trắc");
            assertThat(result.result().get(0).totalParticipants()).isZero();
            verify(auctionSessionRepository).findAllPublicAuctions(
                    eq(List.of(AuctionSessionStatus.WAITING, AuctionSessionStatus.ACTIVE)),
                    any()
            );
        }

        @Test
        @DisplayName("should reject unsupported public status filter")
        void getPublicAuctions_invalidStatus_throws() {
            assertThatThrownBy(() -> auctionService.getPublicAuctions(1, 10, "CANCELED"))
                    .isInstanceOf(AppException.class)
                    .satisfies(throwable -> {
                        AppException exception = (AppException) throwable;
                        assertThat(exception.getStatusCode()).isEqualTo(ErrorCode.INVALID_REQUEST.getStatusCode());
                    });
        }
    }

    @Nested
    @DisplayName("getPublicAuctionDetail")
    class GetPublicAuctionDetail {

        @Test
        @DisplayName("should return detail for public auction status")
        void getPublicAuctionDetail_publicStatus_success() {
            AuctionSession session = createAuctionSession(AuctionSessionStatus.ACTIVE);
            Product product = createProduct(ProductStatus.APPRAISED);
            session.setProduct(product);
            when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
            when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID)).thenReturn(List.of());
            when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.of(createAppraisal()));
            when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(createSeller()));
            when(sellerProfileRepository.findById(SELLER_ID)).thenReturn(Optional.of(createSellerProfile()));

            AuctionDetailRes result = auctionService.getPublicAuctionDetail(AUCTION_ID);

            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(AuctionSessionStatus.ACTIVE);
        }

        @Test
        @DisplayName("should hide canceled auction from public detail")
        void getPublicAuctionDetail_canceled_throwsNotFound() {
            AuctionSession session = createAuctionSession(AuctionSessionStatus.CANCELED);
            session.setProduct(createProduct(ProductStatus.APPRAISED));
            when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));

            assertAppException(
                    () -> auctionService.getPublicAuctionDetail(AUCTION_ID),
                    ErrorCode.AUCTION_SESSION_NOT_FOUND
            );
        }

        @Test
        @DisplayName("should hide ended failed auction from public detail")
        void getPublicAuctionDetail_endedFailed_throwsNotFound() {
            AuctionSession session = createAuctionSession(AuctionSessionStatus.ENDED_FAILED);
            session.setProduct(createProduct(ProductStatus.APPRAISED));
            when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));

            assertAppException(
                    () -> auctionService.getPublicAuctionDetail(AUCTION_ID),
                    ErrorCode.AUCTION_SESSION_NOT_FOUND
            );
        }
    }
}
