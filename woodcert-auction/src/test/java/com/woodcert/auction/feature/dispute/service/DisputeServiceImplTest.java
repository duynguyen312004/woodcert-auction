package com.woodcert.auction.feature.dispute.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeEvidence;
import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;
import com.woodcert.auction.feature.dispute.repository.DisputeCaseRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeEvidenceRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

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
    @Mock private DisputeFulfillmentPort disputeFulfillmentPort;
    @Mock private OrderService orderService;
    @Mock private MediaAssetService mediaAssetService;
    @Mock private MediaUrlBuilder mediaUrlBuilder;
    @Mock private AdminAuditLogService adminAuditLogService;

    private DisputeServiceImpl disputeService;

    @BeforeEach
    void setUp() {
        disputeService = new DisputeServiceImpl(
                disputeCaseRepository,
                disputeEvidenceRepository,
                disputeFulfillmentPort,
                orderService,
                mediaAssetService,
                new CloudinaryProperties(),
                mediaUrlBuilder,
                adminAuditLogService
        );
    }

    @Test
    void getDisputeHistory_authorizesThroughOrderAndReturnsAllDisputes() {
        DisputeCase open = openDispute();
        DisputeCase resolved = openDispute();
        resolved.setId(DISPUTE_ID + 1);
        resolved.setStatus(DisputeStatus.RESOLVED);
        resolved.setResolvedAt(Instant.now());

        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(disputeCaseRepository.findByOrderIdOrderByOpenedAtDescIdDesc(ORDER_ID))
                .thenReturn(List.of(open, resolved));
        when(disputeEvidenceRepository.findByDisputeCaseIdIn(List.of(DISPUTE_ID, DISPUTE_ID + 1)))
                .thenReturn(List.of());

        var result = disputeService.getDisputeHistory(BUYER_ID, ORDER_ID);

        assertThat(result).extracting("id").containsExactly(DISPUTE_ID, DISPUTE_ID + 1);
        verify(orderService).getOrderDetail(BUYER_ID, ORDER_ID);
        verify(disputeEvidenceRepository).findByDisputeCaseIdIn(List.of(DISPUTE_ID, DISPUTE_ID + 1));
        verify(disputeEvidenceRepository, never()).findByDisputeCaseIdOrderBySortOrderAscIdAsc(any());
    }

    @Test
    void getAdminDisputes_groupsBulkEvidenceByDisputeAndKeepsSortOrder() {
        DisputeCase first = openDispute();
        DisputeCase second = openDispute();
        second.setId(DISPUTE_ID + 1);
        DisputeEvidence secondEvidence = evidence(202L, second.getId(), 1);
        DisputeEvidence firstEvidenceLater = evidence(102L, first.getId(), 2);
        DisputeEvidence firstEvidenceEarlier = evidence(101L, first.getId(), 0);

        var pageable = PageRequest.of(0, 20);
        when(disputeCaseRepository.findAllByOrderByOpenedAtDescIdDesc(any()))
                .thenReturn(new PageImpl<>(List.of(first, second), pageable, 2));
        when(disputeEvidenceRepository.findByDisputeCaseIdIn(List.of(DISPUTE_ID, DISPUTE_ID + 1)))
                .thenReturn(List.of(secondEvidence, firstEvidenceLater, firstEvidenceEarlier));
        when(mediaUrlBuilder.buildDeliveryUrl(any(), any())).thenReturn("https://example.test/evidence");

        var result = disputeService.getAdminDisputes(null, 1, 20);

        assertThat(result.result()).hasSize(2);
        assertThat(result.result().get(0).evidence())
                .extracting("mediaId")
                .containsExactly(101L, 102L);
        assertThat(result.result().get(1).evidence())
                .extracting("mediaId")
                .containsExactly(202L);
        verify(disputeEvidenceRepository).findByDisputeCaseIdIn(List.of(DISPUTE_ID, DISPUTE_ID + 1));
        verify(disputeEvidenceRepository, never()).findByDisputeCaseIdOrderBySortOrderAscIdAsc(any());
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
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
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
        verify(orderService).resolveDisputeSellerWins(ORDER_ID);
        verify(disputeFulfillmentPort).markDisputeSellerWins(ORDER_ID);
        verify(adminAuditLogService).log(any(), any(), any(), any(), any(), any());
    }

    @Test
    void resolveDispute_buyerWinsRefundsOrderAndCancelsFulfillment() {
        DisputeCase dispute = openDispute();
        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
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
        verify(orderService).resolveDisputeBuyerWins(ORDER_ID);
        verify(disputeFulfillmentPort).markDisputeBuyerWins(ORDER_ID);
        verify(adminAuditLogService).log(any(), any(), any(), any(), any(), any());
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

    private MediaAsset activeEvidenceAsset(Long mediaId) {
        MediaAsset asset = new MediaAsset();
        asset.setId(mediaId);
        asset.setOwnerUserId(BUYER_ID);
        asset.setUsageType(MediaUsageType.DISPUTE_EVIDENCE);
        asset.setResourceType(MediaResourceType.IMAGE);
        asset.setStatus(MediaStatus.ACTIVE);
        return asset;
    }

    private DisputeEvidence evidence(Long mediaId, Long disputeId, int sortOrder) {
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setId(mediaId);
        evidence.setDisputeCaseId(disputeId);
        evidence.setMediaId(mediaId);
        evidence.setSortOrder(sortOrder);
        evidence.setMediaAsset(activeEvidenceAsset(mediaId));
        return evidence;
    }

    private OrderRes orderRes(OrderStatus status) {
        return new OrderRes(
                ORDER_ID,
                OrderSourceType.AUCTION,
                501L,
                801L,
                BUYER_ID,
                "seller-1",
                null,
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
                null,
                null,
                null,
                null,
                new OrderFulfillmentSummaryRes(
                        FULFILLMENT_ID,
                        "SHIPPED",
                        "THIRD_PARTY",
                        "Viettel Post",
                        "TRK-1",
                        Instant.now(),
                        null,
                        Instant.now().plusSeconds(3600)),
                Instant.now(),
                Instant.now()
        );
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
