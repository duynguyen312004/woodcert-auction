package com.woodcert.auction.feature.auction.service.command;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.auction.service.assembler.AuctionResponseAssembler;
import com.woodcert.auction.feature.auction.service.policy.AuctionPolicy;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionCommandServiceTest {

    private static final String SELLER_ID = "seller-uuid-001";
    private static final String BIDDER_ID = "bidder-uuid-001";
    private static final Long PRODUCT_ID = 10L;
    private static final Long AUCTION_ID = 20L;

    @Mock
    private AuctionSessionRepository auctionSessionRepository;
    @Mock
    private AuctionParticipantRepository auctionParticipantRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private AuctionRedisService auctionRedisService;
    @Mock
    private AuctionResponseAssembler responseAssembler;
    @Mock
    private WalletService walletService;

    private final AuctionPolicy auctionPolicy = new AuctionPolicy();

    private AuctionCommandService commandService;

    @BeforeEach
    void setUp() {
        commandService = new AuctionCommandService(
                auctionSessionRepository,
                auctionParticipantRepository,
                productRepository,
                auctionRedisService,
                responseAssembler,
                auctionPolicy,
                walletService);
    }

    @Test
    void createAuctionSession_success_usesLockedProduct() {
        Product product = product(ProductStatus.APPRAISED);
        AuctionDetailRes expected = detailRes();
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(false);
        when(auctionSessionRepository.save(any(AuctionSession.class))).thenAnswer(invocation -> {
            AuctionSession session = invocation.getArgument(0);
            session.setId(AUCTION_ID);
            return session;
        });
        when(responseAssembler.toDetailRes(any(AuctionSession.class), any(Product.class), any(AuctionRuntimeSnapshot.class)))
                .thenReturn(expected);

        AuctionDetailRes result = commandService.createAuctionSession(SELLER_ID, validRequest());

        assertThat(result).isSameAs(expected);
        verify(productRepository).findByIdForUpdate(PRODUCT_ID);
    }

    @Test
    void createAuctionSession_conflict_throws() {
        Product product = product(ProductStatus.APPRAISED);
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(true);

        assertAppException(
                () -> commandService.createAuctionSession(SELLER_ID, validRequest()),
                ErrorCode.AUCTION_SESSION_CONFLICT);
    }

    @Test
    void createAuctionSession_nonOwner_throws() {
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product(ProductStatus.APPRAISED)));

        assertAppException(
                () -> commandService.createAuctionSession("other-seller", validRequest()),
                ErrorCode.AUCTION_PRODUCT_NOT_OWNED);
    }

    @Test
    void createAuctionSession_nonAppraised_throws() {
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product(ProductStatus.DRAFT)));

        assertAppException(
                () -> commandService.createAuctionSession(SELLER_ID, validRequest()),
                ErrorCode.AUCTION_PRODUCT_NOT_APPRAISED);
    }

    @Test
    void createAuctionSession_invalidPrice_throws() {
        Product product = product(ProductStatus.APPRAISED);
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(auctionSessionRepository.existsActiveOrWaitingByProductId(PRODUCT_ID)).thenReturn(false);

        CreateAuctionSessionReq request = new CreateAuctionSessionReq(
                PRODUCT_ID,
                new BigDecimal("10000000"),
                new BigDecimal("9000000"),
                new BigDecimal("100000"),
                new BigDecimal("1000000"),
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200));

        assertAppException(
                () -> commandService.createAuctionSession(SELLER_ID, request),
                ErrorCode.AUCTION_RESERVE_PRICE_INVALID);
    }

    @Test
    void cancelAuctionSession_success_usesLockedSession() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));

        commandService.cancelAuctionSession(SELLER_ID, AUCTION_ID);

        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.CANCELED);
        verify(auctionSessionRepository).findByIdWithProductForUpdate(AUCTION_ID);
    }

    @Test
    void cancelAuctionSession_active_throws() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));

        assertAppException(
                () -> commandService.cancelAuctionSession(SELLER_ID, AUCTION_ID),
                ErrorCode.AUCTION_SESSION_NOT_CANCELABLE);
    }

    @Test
    void registerForAuction_waiting_success() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.existsByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID)).thenReturn(false);

        commandService.registerForAuction(BIDDER_ID, AUCTION_ID);

        verify(walletService).freezeFunds(
                BIDDER_ID,
                "auction:register:freeze:" + AUCTION_ID + ":" + BIDDER_ID,
                session.getDepositAmount(),
                AUCTION_ID,
                WalletReferenceType.AUCTION);
        verify(auctionParticipantRepository).saveAndFlush(any(AuctionParticipant.class));
    }

    @Test
    void registerForAuction_active_success() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID)).thenReturn(Instant.now().plusSeconds(600).toEpochMilli());
        when(auctionParticipantRepository.existsByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID)).thenReturn(false);
        when(auctionRedisService.addBidder(AUCTION_ID, BIDDER_ID)).thenReturn(true);

        commandService.registerForAuction(BIDDER_ID, AUCTION_ID);

        verify(auctionRedisService).addBidder(AUCTION_ID, BIDDER_ID);
    }

    @Test
    void registerForAuction_activeMissingRedis_throwsNotActiveBeforeFreeze() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID)).thenReturn(null);

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_NOT_ACTIVE);

        verify(walletService, never()).freezeFunds(any(), any(), any(), any(), any());
        verify(auctionParticipantRepository, never()).saveAndFlush(any());
    }

    @Test
    void registerForAuction_activeExpiredRedis_throwsNotActiveBeforeFreeze() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID)).thenReturn(Instant.now().minusSeconds(1).toEpochMilli());

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_NOT_ACTIVE);

        verify(walletService, never()).freezeFunds(any(), any(), any(), any(), any());
        verify(auctionParticipantRepository, never()).saveAndFlush(any());
    }

    @Test
    void registerForAuction_activeAddBidderFailure_throwsAfterParticipantInsert() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getEndTimeEpochMs(AUCTION_ID)).thenReturn(Instant.now().plusSeconds(600).toEpochMilli());
        when(auctionParticipantRepository.existsByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID)).thenReturn(false);
        when(auctionRedisService.addBidder(AUCTION_ID, BIDDER_ID)).thenReturn(false);

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_NOT_ACTIVE);

        verify(walletService).freezeFunds(
                BIDDER_ID,
                "auction:register:freeze:" + AUCTION_ID + ":" + BIDDER_ID,
                session.getDepositAmount(),
                AUCTION_ID,
                WalletReferenceType.AUCTION);
        verify(auctionParticipantRepository).saveAndFlush(any(AuctionParticipant.class));
    }

    @Test
    void registerForAuction_sellerOwnAuction_throwsSelfBidding() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));

        assertAppException(
                () -> commandService.registerForAuction(SELLER_ID, AUCTION_ID),
                ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);

        verify(walletService, never()).freezeFunds(any(), any(), any(), any(), any());
    }

    @Test
    void registerForAuction_duplicatePreCheck_throwsAlreadyRegistered() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.existsByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID)).thenReturn(true);

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_ALREADY_REGISTERED);

        verify(walletService, never()).freezeFunds(any(), any(), any(), any(), any());
        verify(auctionParticipantRepository, never()).saveAndFlush(any());
    }

    @Test
    void registerForAuction_duplicateInsertRace_throwsAlreadyRegistered() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.existsByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("duplicate"))
                .when(auctionParticipantRepository).saveAndFlush(any(AuctionParticipant.class));

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_ALREADY_REGISTERED);
    }

    private Product product(ProductStatus status) {
        Product product = new Product();
        product.setId(PRODUCT_ID);
        product.setSellerId(SELLER_ID);
        product.setTitle("Wood statue");
        product.setStatus(status);
        return product;
    }

    private AuctionSession session(AuctionSessionStatus status) {
        AuctionSession session = new AuctionSession();
        session.setId(AUCTION_ID);
        session.setProductId(PRODUCT_ID);
        session.setStartingPrice(new BigDecimal("10000000"));
        session.setReservePrice(new BigDecimal("12000000"));
        session.setStepPrice(new BigDecimal("100000"));
        session.setDepositAmount(new BigDecimal("1000000"));
        session.setCurrentPrice(new BigDecimal("10000000"));
        session.setStartTime(Instant.now().plusSeconds(3600));
        session.setEndTime(Instant.now().plusSeconds(7200));
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
                Instant.now().plusSeconds(7200));
    }

    private AuctionDetailRes detailRes() {
        return new AuctionDetailRes(
                AUCTION_ID,
                AuctionSessionStatus.WAITING,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                Instant.now(),
                Instant.now(),
                null,
                null);
    }

    private void assertAppException(Runnable action, ErrorCode expected) {
        assertThatThrownBy(action::run)
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getStatusCode()).isEqualTo(expected.getStatusCode());
                    assertThat(exception.getMessage()).isEqualTo(expected.getMessage());
                });
    }
}
