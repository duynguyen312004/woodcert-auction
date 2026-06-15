package com.woodcert.auction.feature.dispute.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeMessageReq;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.entity.DisputeAuthorRole;
import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeEvidence;
import com.woodcert.auction.feature.dispute.entity.DisputeMessage;
import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;
import com.woodcert.auction.feature.dispute.repository.DisputeCaseRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeEvidenceRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeMessageRepository;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

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
    private static final String SELLER_ID = "seller-1";
    private static final String ADMIN_ID = "admin-1";
    private static final Instant OPENED_AT = Instant.parse("2026-06-02T00:00:00Z");

    @Mock private DisputeCaseRepository disputeCaseRepository;
    @Mock private DisputeEvidenceRepository disputeEvidenceRepository;
    @Mock private DisputeMessageRepository disputeMessageRepository;
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
                disputeMessageRepository,
                disputeFulfillmentPort,
                orderService,
                mediaAssetService,
                new CloudinaryProperties(),
                mediaUrlBuilder,
                adminAuditLogService
        );
    }

    @Test
    void getDisputeHistory_authorizesThroughOrderAndReturnsOnlyOpeningEvidence() {
        DisputeCase open = openDispute();
        DisputeCase resolved = openDispute();
        resolved.setId(DISPUTE_ID + 1);
        resolved.setStatus(DisputeStatus.RESOLVED);
        resolved.setResolvedAt(OPENED_AT.plusSeconds(600));

        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(disputeCaseRepository.findByOrderIdOrderByOpenedAtDescIdDesc(ORDER_ID))
                .thenReturn(List.of(open, resolved));
        when(disputeEvidenceRepository.findByDisputeCaseIdInAndMessageIdIsNull(
                List.of(DISPUTE_ID, DISPUTE_ID + 1)))
                .thenReturn(List.of());

        var result = disputeService.getDisputeHistory(BUYER_ID, ORDER_ID);

        assertThat(result).extracting("id").containsExactly(DISPUTE_ID, DISPUTE_ID + 1);
        verify(orderService).getOrderDetail(BUYER_ID, ORDER_ID);
        verify(disputeEvidenceRepository).findByDisputeCaseIdInAndMessageIdIsNull(
                List.of(DISPUTE_ID, DISPUTE_ID + 1));
        verify(disputeEvidenceRepository, never())
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(any());
    }

    @Test
    void getDisputeDetail_keepsLegacyEvidenceOnOpeningAndOrdersMessageEvidence() {
        DisputeCase dispute = openDispute();
        DisputeEvidence openingEvidence = evidence(101L, DISPUTE_ID, null, 0, BUYER_ID);
        DisputeMessage buyerMessage = message(
                41L,
                DisputeAuthorRole.BUYER,
                BUYER_ID,
                "Them bang chung",
                OPENED_AT.plusSeconds(60));
        DisputeMessage adminMessage = message(
                42L,
                DisputeAuthorRole.ADMIN,
                ADMIN_ID,
                "Can bo sung hoa don",
                OPENED_AT.plusSeconds(120));
        DisputeEvidence laterImage = evidence(202L, DISPUTE_ID, 41L, 2, BUYER_ID);
        DisputeEvidence earlierImage = evidence(201L, DISPUTE_ID, 41L, 0, BUYER_ID);

        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(disputeCaseRepository.findByIdAndOrderId(DISPUTE_ID, ORDER_ID))
                .thenReturn(Optional.of(dispute));
        when(disputeEvidenceRepository
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of(openingEvidence));
        when(disputeMessageRepository.findByDisputeCaseIdOrderByCreatedAtAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of(buyerMessage, adminMessage));
        when(disputeEvidenceRepository.findByMessageIdIn(List.of(41L, 42L)))
                .thenReturn(List.of(laterImage, earlierImage));
        when(mediaUrlBuilder.buildDeliveryUrl(any(), any())).thenReturn("https://example.test/evidence");

        var result = disputeService.getDisputeDetail(BUYER_ID, ORDER_ID, DISPUTE_ID);

        assertThat(result.dispute().evidence()).extracting("mediaId").containsExactly(101L);
        assertThat(result.messages()).extracting("authorRole")
                .containsExactly(DisputeAuthorRole.BUYER, DisputeAuthorRole.ADMIN);
        assertThat(result.messages().get(0).evidence()).extracting("mediaId")
                .containsExactly(201L, 202L);
        assertThat(result.messages().get(1).evidence()).isEmpty();
    }

    @Test
    void getDisputeDetail_rejectsUserOutsideOrder() {
        when(orderService.getOrderDetail("outsider-1", ORDER_ID))
                .thenThrow(new AppException(ErrorCode.ORDER_NOT_OWNED));

        assertError(
                () -> disputeService.getDisputeDetail("outsider-1", ORDER_ID, DISPUTE_ID),
                ErrorCode.ORDER_NOT_OWNED);

        verify(disputeCaseRepository, never()).findByIdAndOrderId(any(), any());
    }

    @Test
    void addParticipantMessage_acceptsBuyerTextOnlyAndDerivesRole() {
        DisputeCase dispute = openDispute();
        AtomicReference<DisputeMessage> savedMessage = prepareMessageCreation(
                dispute,
                BUYER_ID,
                orderRes(OrderStatus.DISPUTED));

        var result = disputeService.addParticipantMessage(
                BUYER_ID,
                ORDER_ID,
                DISPUTE_ID,
                new CreateDisputeMessageReq("  San pham bi nut  ", List.of())
        );

        assertThat(savedMessage.get().getAuthorRole()).isEqualTo(DisputeAuthorRole.BUYER);
        assertThat(savedMessage.get().getAuthorUserId()).isEqualTo(BUYER_ID);
        assertThat(savedMessage.get().getContent()).isEqualTo("San pham bi nut");
        assertThat(result.messages()).singleElement().satisfies(message -> {
            assertThat(message.authorRole()).isEqualTo(DisputeAuthorRole.BUYER);
            assertThat(message.content()).isEqualTo("San pham bi nut");
            assertThat(message.evidence()).isEmpty();
        });
        verify(disputeEvidenceRepository, never()).saveAll(any());
    }

    @Test
    void addParticipantMessage_acceptsSellerImageOnlyAndLinksEvidenceToMessage() {
        DisputeCase dispute = openDispute();
        AtomicReference<DisputeMessage> savedMessage = prepareMessageCreation(
                dispute,
                SELLER_ID,
                orderRes(OrderStatus.DISPUTED));
        when(mediaAssetService.getOwnedAssetOrThrow(301L, SELLER_ID))
                .thenReturn(activeEvidenceAsset(301L, SELLER_ID));

        disputeService.addParticipantMessage(
                SELLER_ID,
                ORDER_ID,
                DISPUTE_ID,
                new CreateDisputeMessageReq(null, List.of(301L))
        );

        assertThat(savedMessage.get().getAuthorRole()).isEqualTo(DisputeAuthorRole.SELLER);
        assertThat(savedMessage.get().getContent()).isNull();
        ArgumentCaptor<List<DisputeEvidence>> evidenceCaptor = listCaptor();
        verify(disputeEvidenceRepository).saveAll(evidenceCaptor.capture());
        assertThat(evidenceCaptor.getValue()).singleElement().satisfies(evidence -> {
            assertThat(evidence.getMessageId()).isEqualTo(501L);
            assertThat(evidence.getDisputeCaseId()).isEqualTo(DISPUTE_ID);
            assertThat(evidence.getMediaId()).isEqualTo(301L);
            assertThat(evidence.getUploadedByUserId()).isEqualTo(SELLER_ID);
        });
    }

    @Test
    void addParticipantMessage_rejectsEmptyMessage() {
        DisputeCase dispute = openDispute();
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));

        assertError(
                () -> disputeService.addParticipantMessage(
                        BUYER_ID,
                        ORDER_ID,
                        DISPUTE_ID,
                        new CreateDisputeMessageReq("  ", List.of())),
                ErrorCode.DISPUTE_MESSAGE_REQUIRED);

        verify(disputeMessageRepository, never()).save(any());
    }

    @Test
    void addParticipantMessage_rejectsEvidenceOwnedByAnotherUser() {
        DisputeCase dispute = openDispute();
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(mediaAssetService.getOwnedAssetOrThrow(301L, BUYER_ID))
                .thenThrow(new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        assertError(
                () -> disputeService.addParticipantMessage(
                        BUYER_ID,
                        ORDER_ID,
                        DISPUTE_ID,
                        new CreateDisputeMessageReq(null, List.of(301L))),
                ErrorCode.RESOURCE_NOT_FOUND);

        verify(disputeMessageRepository, never()).save(any());
    }

    @Test
    void addParticipantMessage_rejectsClosedDispute() {
        DisputeCase dispute = openDispute();
        dispute.setStatus(DisputeStatus.RESOLVED);
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(orderService.getOrderDetail(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.COMPLETED));

        assertError(
                () -> disputeService.addParticipantMessage(
                        BUYER_ID,
                        ORDER_ID,
                        DISPUTE_ID,
                        new CreateDisputeMessageReq("Them noi dung", List.of())),
                ErrorCode.DISPUTE_INVALID_STATUS);

        verify(disputeMessageRepository, never()).save(any());
    }

    @Test
    void addAdminMessage_acceptsTextAndUsesAdminRole() {
        DisputeCase dispute = openDispute();
        AtomicReference<DisputeMessage> savedMessage = prepareAdminMessageCreation(dispute);

        var result = disputeService.addAdminMessage(
                ADMIN_ID,
                DISPUTE_ID,
                new CreateDisputeMessageReq("Vui long bo sung anh kien hang", null)
        );

        assertThat(savedMessage.get().getAuthorRole()).isEqualTo(DisputeAuthorRole.ADMIN);
        assertThat(savedMessage.get().getAuthorUserId()).isEqualTo(ADMIN_ID);
        assertThat(result.messages()).extracting("authorRole")
                .containsExactly(DisputeAuthorRole.ADMIN);
    }

    @Test
    void getAdminDisputes_groupsBulkOpeningEvidenceByDisputeAndKeepsSortOrder() {
        DisputeCase first = openDispute();
        DisputeCase second = openDispute();
        second.setId(DISPUTE_ID + 1);
        DisputeEvidence secondEvidence = evidence(202L, second.getId(), null, 1, BUYER_ID);
        DisputeEvidence firstEvidenceLater = evidence(102L, first.getId(), null, 2, BUYER_ID);
        DisputeEvidence firstEvidenceEarlier = evidence(101L, first.getId(), null, 0, BUYER_ID);

        var pageable = PageRequest.of(0, 20);
        when(disputeCaseRepository.findAllByOrderByOpenedAtDescIdDesc(any()))
                .thenReturn(new PageImpl<>(List.of(first, second), pageable, 2));
        when(disputeEvidenceRepository.findByDisputeCaseIdInAndMessageIdIsNull(
                List.of(DISPUTE_ID, DISPUTE_ID + 1)))
                .thenReturn(List.of(secondEvidence, firstEvidenceLater, firstEvidenceEarlier));
        when(mediaUrlBuilder.buildDeliveryUrl(any(), any())).thenReturn("https://example.test/evidence");

        var result = disputeService.getAdminDisputes(null, 1, 20);

        assertThat(result.result()).hasSize(2);
        assertThat(result.result().get(0).evidence()).extracting("mediaId")
                .containsExactly(101L, 102L);
        assertThat(result.result().get(1).evidence()).extracting("mediaId")
                .containsExactly(202L);
    }

    @Test
    void openDispute_rejectsWhenAnotherActiveDisputeExists() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.of(openDispute()));

        assertError(
                () -> disputeService.openDispute(
                        BUYER_ID,
                        ORDER_ID,
                        new CreateDisputeReq("Sai hang", "Mo ta", List.of(101L))),
                ErrorCode.DISPUTE_ALREADY_OPEN);

        verify(orderService, never()).openDispute(any(), any());
        verify(mediaAssetService, never()).getOwnedAssetOrThrow(any(), any());
    }

    @Test
    void openDispute_requiresAtLeastOneEvidenceFile() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.empty());

        assertError(
                () -> disputeService.openDispute(
                        BUYER_ID,
                        ORDER_ID,
                        new CreateDisputeReq("Sai hang", "Mo ta", List.of())),
                ErrorCode.DISPUTE_EVIDENCE_REQUIRED);

        verify(orderService, never()).openDispute(any(), any());
    }

    @Test
    void openDispute_locksOrderAndStoresOpeningEvidenceReferences() {
        when(disputeCaseRepository.findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(any(), any()))
                .thenReturn(Optional.empty());
        when(mediaAssetService.getOwnedAssetOrThrow(101L, BUYER_ID))
                .thenReturn(activeEvidenceAsset(101L, BUYER_ID));
        when(orderService.openDispute(BUYER_ID, ORDER_ID)).thenReturn(orderRes(OrderStatus.DISPUTED));
        when(disputeCaseRepository.save(any(DisputeCase.class))).thenAnswer(invocation -> {
            DisputeCase dispute = invocation.getArgument(0);
            dispute.setId(DISPUTE_ID);
            return dispute;
        });
        when(disputeEvidenceRepository
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(DISPUTE_ID))
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
        ArgumentCaptor<List<DisputeEvidence>> evidenceCaptor = listCaptor();
        verify(disputeEvidenceRepository).saveAll(evidenceCaptor.capture());
        assertThat(evidenceCaptor.getValue()).singleElement()
                .satisfies(evidence -> assertThat(evidence.getMessageId()).isNull());
    }

    @Test
    void resolveDispute_sellerWinsCompletesOrderAndAutoCompletesFulfillment() {
        DisputeCase dispute = openDispute();
        prepareResolution(dispute);

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
        prepareResolution(dispute);

        var result = disputeService.resolveDispute(
                ADMIN_ID,
                DISPUTE_ID,
                new ResolveDisputeReq(DisputeResolutionOutcome.BUYER_WINS, "Hoan tien")
        );

        assertThat(result.status()).isEqualTo(DisputeStatus.RESOLVED);
        assertThat(result.resolutionOutcome()).isEqualTo(DisputeResolutionOutcome.BUYER_WINS);
        verify(orderService).resolveDisputeBuyerWins(ORDER_ID);
        verify(disputeFulfillmentPort).markDisputeBuyerWins(ORDER_ID);
    }

    private AtomicReference<DisputeMessage> prepareMessageCreation(
            DisputeCase dispute,
            String userId,
            OrderRes order) {
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(orderService.getOrderDetail(userId, ORDER_ID)).thenReturn(order);
        return prepareSavedMessageResponse();
    }

    private AtomicReference<DisputeMessage> prepareAdminMessageCreation(DisputeCase dispute) {
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        return prepareSavedMessageResponse();
    }

    private AtomicReference<DisputeMessage> prepareSavedMessageResponse() {
        AtomicReference<DisputeMessage> savedMessage = new AtomicReference<>();
        when(disputeMessageRepository.save(any(DisputeMessage.class))).thenAnswer(invocation -> {
            DisputeMessage message = invocation.getArgument(0);
            message.setId(501L);
            message.setCreatedAt(OPENED_AT.plusSeconds(300));
            savedMessage.set(message);
            return message;
        });
        when(disputeEvidenceRepository
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of());
        when(disputeMessageRepository.findByDisputeCaseIdOrderByCreatedAtAscIdAsc(DISPUTE_ID))
                .thenAnswer(invocation -> List.of(savedMessage.get()));
        when(disputeEvidenceRepository.findByMessageIdIn(List.of(501L))).thenReturn(List.of());
        return savedMessage;
    }

    private void prepareResolution(DisputeCase dispute) {
        when(disputeCaseRepository.findByIdForUpdate(DISPUTE_ID)).thenReturn(Optional.of(dispute));
        when(disputeCaseRepository.save(any(DisputeCase.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(disputeEvidenceRepository
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(DISPUTE_ID))
                .thenReturn(List.of());
    }

    private void assertError(ThrowingAction action, ErrorCode errorCode) {
        assertThatThrownBy(action::run)
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(errorCode));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ArgumentCaptor<List<DisputeEvidence>> listCaptor() {
        return ArgumentCaptor.forClass((Class) List.class);
    }

    private DisputeCase openDispute() {
        DisputeCase dispute = new DisputeCase();
        dispute.setId(DISPUTE_ID);
        dispute.setOrderId(ORDER_ID);
        dispute.setFulfillmentId(FULFILLMENT_ID);
        dispute.setOpenedByUserId(BUYER_ID);
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setReason("Sai hang");
        dispute.setOpenedAt(OPENED_AT);
        return dispute;
    }

    private DisputeMessage message(
            Long id,
            DisputeAuthorRole role,
            String authorId,
            String content,
            Instant createdAt) {
        DisputeMessage message = new DisputeMessage();
        message.setId(id);
        message.setDisputeCaseId(DISPUTE_ID);
        message.setAuthorRole(role);
        message.setAuthorUserId(authorId);
        message.setContent(content);
        message.setCreatedAt(createdAt);
        return message;
    }

    private MediaAsset activeEvidenceAsset(Long mediaId, String ownerId) {
        MediaAsset asset = new MediaAsset();
        asset.setId(mediaId);
        asset.setOwnerUserId(ownerId);
        asset.setUsageType(MediaUsageType.DISPUTE_EVIDENCE);
        asset.setResourceType(MediaResourceType.IMAGE);
        asset.setStatus(MediaStatus.ACTIVE);
        asset.setOriginalFilename("evidence-" + mediaId + ".jpg");
        return asset;
    }

    private DisputeEvidence evidence(
            Long mediaId,
            Long disputeId,
            Long messageId,
            int sortOrder,
            String ownerId) {
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setId(mediaId);
        evidence.setDisputeCaseId(disputeId);
        evidence.setMessageId(messageId);
        evidence.setMediaId(mediaId);
        evidence.setUploadedByUserId(ownerId);
        evidence.setSortOrder(sortOrder);
        evidence.setMediaAsset(activeEvidenceAsset(mediaId, ownerId));
        return evidence;
    }

    private OrderRes orderRes(OrderStatus status) {
        return new OrderRes(
                ORDER_ID,
                OrderSourceType.AUCTION,
                501L,
                801L,
                BUYER_ID,
                SELLER_ID,
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
                        OPENED_AT,
                        null,
                        OPENED_AT.plusSeconds(3600)),
                OPENED_AT,
                OPENED_AT
        );
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run();
    }
}
