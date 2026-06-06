package com.woodcert.auction.feature.auction.service.command;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.auction.service.AuctionSettlementService;
import com.woodcert.auction.feature.auction.service.assembler.AuctionResponseAssembler;
import com.woodcert.auction.feature.auction.service.policy.AuctionPolicy;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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
    private AuctionSettlementService auctionSettlementService;
    @Mock
    private AuctionResponseAssembler responseAssembler;
    @Mock
    private WalletService walletService;
    @Mock
    private ProductImageHelper productImageHelper;
    @Mock
    private AppraisalReportRepository appraisalReportRepository;
    @Mock
    private SellerSummaryQueryService sellerSummaryQueryService;

    private final AuctionPolicy auctionPolicy = new AuctionPolicy();

    private AuctionCommandService commandService;

    @BeforeEach
    void setUp() {
        commandService = new AuctionCommandService(
                auctionSessionRepository,
                auctionParticipantRepository,
                productRepository,
                auctionRedisService,
                auctionSettlementService,
                responseAssembler,
                auctionPolicy,
                walletService,
                productImageHelper,
                appraisalReportRepository,
                sellerSummaryQueryService);
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
        when(appraisalReportRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.empty());
        when(sellerSummaryQueryService.findSellerSummary(SELLER_ID)).thenReturn(Optional.empty());
        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn(null);
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of());
        when(responseAssembler.toDetailRes(
                any(AuctionSession.class),
                any(Product.class),
                any(),
                any(),
                any(),
                any(),
                any(AuctionRuntimeSnapshot.class),
                any()))
                .thenReturn(expected);

        AuctionDetailRes result = commandService.createAuctionSession(SELLER_ID, validRequest());

        assertThat(result).isSameAs(expected);
        assertThat(product.getSaleStatus()).isEqualTo(ProductSaleStatus.IN_AUCTION);
        verify(productRepository).findByIdForUpdate(PRODUCT_ID);
        verify(productRepository).save(product);
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
    void createAuctionSession_soldProduct_throws() {
        Product product = product(ProductStatus.APPRAISED);
        product.setSaleStatus(ProductSaleStatus.SOLD);
        when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

        assertAppException(
                () -> commandService.createAuctionSession(SELLER_ID, validRequest()),
                ErrorCode.AUCTION_PRODUCT_NOT_AVAILABLE);
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
        Product product = product(ProductStatus.APPRAISED);
        product.setSaleStatus(ProductSaleStatus.IN_AUCTION);
        session.setProduct(product);
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));

        commandService.cancelAuctionSession(SELLER_ID, AUCTION_ID);

        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.CANCELED);
        assertThat(product.getSaleStatus()).isEqualTo(ProductSaleStatus.AVAILABLE);
        verify(auctionSessionRepository).findByIdWithProductForUpdate(AUCTION_ID);
        verify(auctionSettlementService).refundCanceledSession(AUCTION_ID);
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
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.empty());

        commandService.registerForAuction(BIDDER_ID, AUCTION_ID);

        verify(walletService).freezeFunds(
                BIDDER_ID,
                FinanceOperationKeys.auctionRegistrationFreeze(AUCTION_ID, BIDDER_ID),
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
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.empty());
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
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.empty());
        when(auctionRedisService.addBidder(AUCTION_ID, BIDDER_ID)).thenReturn(false);

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_NOT_ACTIVE);

        verify(walletService).freezeFunds(
                BIDDER_ID,
                FinanceOperationKeys.auctionRegistrationFreeze(AUCTION_ID, BIDDER_ID),
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
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.of(participant(DepositStatus.FROZEN)));

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
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.empty());
        doThrow(new DataIntegrityViolationException("duplicate"))
                .when(auctionParticipantRepository).saveAndFlush(any(AuctionParticipant.class));

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_ALREADY_REGISTERED);
    }

    @Test
    void registerForAuction_withdrawnParticipant_throwsCannotRegisterAgain() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        session.setProduct(product(ProductStatus.APPRAISED));
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserId(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.of(participant(DepositStatus.WITHDRAWN)));

        assertAppException(
                () -> commandService.registerForAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_REGISTRATION_WITHDRAWN);

        verify(walletService, never()).freezeFunds(any(), any(), any(), any(), any());
    }

    @Test
    void withdrawFromAuction_waitingFrozenParticipant_refundsAndMarksWithdrawn() {
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        AuctionParticipant participant = participant(DepositStatus.FROZEN);
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserIdForUpdate(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.of(participant));

        commandService.withdrawFromAuction(BIDDER_ID, AUCTION_ID);

        verify(walletService).unfreezeFunds(
                BIDDER_ID,
                FinanceOperationKeys.auctionWithdrawalRefund(AUCTION_ID, BIDDER_ID),
                participant.getDepositAmount(),
                AUCTION_ID,
                WalletReferenceType.AUCTION);
        assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.WITHDRAWN);
        assertThat(participant.getWithdrawnAt()).isNotNull();
        verify(auctionParticipantRepository).save(participant);
    }

    @Test
    void withdrawFromAuction_active_throwsBeforeParticipantLookup() {
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID))
                .thenReturn(Optional.of(session(AuctionSessionStatus.ACTIVE)));

        assertAppException(
                () -> commandService.withdrawFromAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_PARTICIPATION_NOT_WITHDRAWABLE);

        verify(auctionParticipantRepository, never())
                .findByAuctionSessionIdAndUserIdForUpdate(AUCTION_ID, BIDDER_ID);
        verify(walletService, never()).unfreezeFunds(any(), any(), any(), any(), any());
    }

    @Test
    void withdrawFromAuction_missingParticipant_throws() {
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID))
                .thenReturn(Optional.of(session(AuctionSessionStatus.WAITING)));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserIdForUpdate(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.empty());

        assertAppException(
                () -> commandService.withdrawFromAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_PARTICIPATION_NOT_FOUND);
    }

    @Test
    void withdrawFromAuction_alreadyWithdrawn_throwsConflict() {
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID))
                .thenReturn(Optional.of(session(AuctionSessionStatus.WAITING)));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserIdForUpdate(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.of(participant(DepositStatus.WITHDRAWN)));

        assertAppException(
                () -> commandService.withdrawFromAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.AUCTION_PARTICIPATION_ALREADY_WITHDRAWN);
    }

    @Test
    void withdrawFromAuction_walletFailure_keepsParticipantFrozen() {
        AuctionParticipant participant = participant(DepositStatus.FROZEN);
        when(auctionSessionRepository.findByIdWithProductForUpdate(AUCTION_ID))
                .thenReturn(Optional.of(session(AuctionSessionStatus.WAITING)));
        when(auctionParticipantRepository.findByAuctionSessionIdAndUserIdForUpdate(AUCTION_ID, BIDDER_ID))
                .thenReturn(Optional.of(participant));
        doThrow(new AppException(ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE))
                .when(walletService)
                .unfreezeFunds(any(), any(), any(), any(), any());

        assertAppException(
                () -> commandService.withdrawFromAuction(BIDDER_ID, AUCTION_ID),
                ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE);

        assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.FROZEN);
        assertThat(participant.getWithdrawnAt()).isNull();
        verify(auctionParticipantRepository, never()).save(participant);
    }

    private Product product(ProductStatus status) {
        Product product = new Product();
        product.setId(PRODUCT_ID);
        product.setSellerId(SELLER_ID);
        product.setTitle("Wood statue");
        product.setStatus(status);
        product.setSaleStatus(ProductSaleStatus.AVAILABLE);
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

    private AuctionParticipant participant(DepositStatus status) {
        AuctionParticipant participant = new AuctionParticipant();
        participant.setId(30L);
        participant.setAuctionSessionId(AUCTION_ID);
        participant.setUserId(BIDDER_ID);
        participant.setDepositAmount(new BigDecimal("1000000"));
        participant.setDepositStatus(status);
        return participant;
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
