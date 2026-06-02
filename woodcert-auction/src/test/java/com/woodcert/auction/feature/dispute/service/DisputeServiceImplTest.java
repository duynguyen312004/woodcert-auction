package com.woodcert.auction.feature.dispute.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;
import com.woodcert.auction.feature.dispute.repository.DisputeCaseRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeEvidenceRepository;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import com.woodcert.auction.feature.order.dto.response.OrderFulfillmentSummaryRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeServiceImplTest {

    private static final Long ORDER_ID = 91L;
    private static final Long DISPUTE_ID = 31L;
    private static final Long FULFILLMENT_ID = 17L;
    private static final String BUYER_ID = "buyer-1";
    private static final String ADMIN_ID = "admin-1";

    @Mock private DisputeCaseRepository disputeCaseRepository;
    @Mock private DisputeEvidenceRepository disputeEvidenceRepository;
    @Mock private FulfillmentRepository fulfillmentRepository;
    @Mock private OrderService orderService;
    @Mock private MediaAssetService mediaAssetService;
    @Mock private MediaUrlBuilder mediaUrlBuilder;

    private DisputeServiceImpl disputeService;

    @BeforeEach
    void setUp() {
        disputeService = new DisputeServiceImpl(
                disputeCaseRepository,
                disputeEvidenceRepository,
                fulfillmentRepository,
                orderService,
                mediaAssetService,
                new CloudinaryProperties(),
                mediaUrlBuilder
        );
    }

    @Test
    void openDispute_rejectsWhenAnotherActiveDisputeExists() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.of(openDispute()));

        assertThatThrownBy(() -> disputeService.openDispute(
                BUYER_ID,
                ORDER_ID,
                new CreateDisputeReq("Sai hang", "Mo ta", List.of(101L))
        ))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(ErrorCode.DISPUTE_ALREADY_OPEN));

        verify(orderService, never()).openDispute(any(), any());
        verify(mediaAssetService, never()).getOwnedAssetOrThrow(any(), any());
    }

    @Test
    void openDispute_requiresAtLeastOneEvidenceFile() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> disputeService.openDispute(
                BUYER_ID,
                ORDER_ID,
                new CreateDisputeReq("Sai hang", "Mo ta", List.of())
        ))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(ErrorCode.DISPUTE_EVIDENCE_REQUIRED));

        verify(orderService, never()).openDispute(any(), any());
    }

    @Test
    void openDispute_locksOrderAndStoresEvidenceReferences() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.empty());
        when(mediaAssetService.getOwnedAssetOrThrow(101L, BUYER_ID))
                .thenReturn(activeEvidenceAsset(101L));
        when(orderService.openDispute(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(disputeCaseRepository.save(any(DisputeCase.class))).thenAnswer(invocation -> {
            DisputeCase dispute = invocation.getArgument(0);
            dispute.setId(DISPUTE_ID);
            return dispute;
        });
        when(disputeEvidenceRepository.findByDisputeCaseIdOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of());

        var result = disputeService.openDispute(
                BUYER_ID,
                ORDER_ID,
                new CreateDisputeReq("Sai hang", "Mo ta", List.of(101L))
        );

        assertThat(result.id()).isEqualTo(DISPUTE_ID);
        assertThat(result.status()).isEqualTo(DisputeStatus.OPEN);
        assertThat(result.fulfillmentId()).isEqualTo(FULFILLMENT_ID);
        verify(orderService).openDispute(BUYER_ID, ORDER_ID);
        verify(disputeEvidenceRepository).saveAll(any());
    }

    @Test
    void resolveDispute_sellerWinsCompletesOrderAndAutoCompletesFulfillment() {
        DisputeCase dispute = openDispute();
        OrderFulfillment fulfillment = shippedFulfillment();
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(disputeCaseRepository.save(any(DisputeCase.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(disputeEvidenceRepository.findByDisputeCaseIdOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of());

        var result = disputeService.resolveDispute(
                ADMIN_ID,
                DISPUTE_ID,
                new ResolveDisputeReq(DisputeResolutionOutcome.SELLER_WINS, "Seller hop le")
        );

        assertThat(result.status()).isEqualTo(DisputeStatus.RESOLVED);
        assertThat(result.resolutionOutcome()).isEqualTo(DisputeResolutionOutcome.SELLER_WINS);
        assertThat(result.resolvedByAdminId()).isEqualTo(ADMIN_ID);
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.AUTO_COMPLETED);
        assertThat(fulfillment.getReceivedAt()).isNotNull();
        verify(orderService).resolveDisputeSellerWins(ORDER_ID);
        verify(fulfillmentRepository).save(fulfillment);
    }

    @Test
    void resolveDispute_buyerWinsRefundsOrderAndCancelsFulfillment() {
        DisputeCase dispute = openDispute();
        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        OrderFulfillment fulfillment = shippedFulfillment();
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(disputeCaseRepository.save(any(DisputeCase.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(disputeEvidenceRepository.findByDisputeCaseIdOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of());

        var result = disputeService.resolveDispute(
                ADMIN_ID,
                DISPUTE_ID,
                new ResolveDisputeReq(DisputeResolutionOutcome.BUYER_WINS, "Hoan tien")
        );

        assertThat(result.status()).isEqualTo(DisputeStatus.RESOLVED);
        assertThat(result.resolutionOutcome()).isEqualTo(DisputeResolutionOutcome.BUYER_WINS);
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.CANCELED);
        assertThat(fulfillment.getReceivedAt()).isNull();
        verify(orderService).resolveDisputeBuyerWins(ORDER_ID);
        verify(fulfillmentRepository).save(fulfillment);
    }

    private DisputeCase openDispute() {
        DisputeCase dispute = new DisputeCase();
        dispute.setId(DISPUTE_ID);
        dispute.setOrderId(ORDER_ID);
        dispute.setFulfillmentId(FULFILLMENT_ID);
        dispute.setOpenedByUserId(BUYER_ID);
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setReason("Sai hang");
        dispute.setOpenedAt(Instant.now());
        return dispute;
    }

    private OrderFulfillment shippedFulfillment() {
        OrderFulfillment fulfillment = new OrderFulfillment();
        fulfillment.setId(FULFILLMENT_ID);
        fulfillment.setOrderId(ORDER_ID);
        fulfillment.setBuyerId(BUYER_ID);
        fulfillment.setSellerId("seller-1");
        fulfillment.setStatus(FulfillmentStatus.SHIPPED);
        fulfillment.setShippedAt(Instant.now());
        return fulfillment;
    }

    private MediaAsset activeEvidenceAsset(Long mediaId) {
        MediaAsset asset = new MediaAsset();
        asset.setId(mediaId);
        asset.setOwnerUserId(BUYER_ID);
        asset.setUsageType(MediaUsageType.DISPUTE_EVIDENCE);
        asset.setResourceType(MediaResourceType.IMAGE);
        asset.setStatus(MediaStatus.ACTIVE);
        return asset;
    }

    private OrderRes orderRes(OrderStatus status) {
        return new OrderRes(
                ORDER_ID,
                OrderSourceType.AUCTION,
                501L,
                801L,
                BUYER_ID,
                "seller-1",
                status,
                money("10000000"),
                money("1000000"),
                money("9000000"),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new OrderFulfillmentSummaryRes(FULFILLMENT_ID, "SHIPPED", "TRK-1", Instant.now(), null, Instant.now().plusSeconds(3600)),
                Instant.now(),
                Instant.now()
        );
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
