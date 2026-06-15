package com.woodcert.auction.feature.dispute.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeMessageReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.dto.response.DisputeDetailRes;
import com.woodcert.auction.feature.dispute.dto.response.DisputeEvidenceRes;
import com.woodcert.auction.feature.dispute.dto.response.DisputeMessageRes;
import com.woodcert.auction.feature.dispute.dto.response.DisputeRes;
import com.woodcert.auction.feature.dispute.entity.DisputeAuthorRole;
import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeEvidence;
import com.woodcert.auction.feature.dispute.entity.DisputeMessage;
import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;
import com.woodcert.auction.feature.dispute.repository.DisputeCaseRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeEvidenceRepository;
import com.woodcert.auction.feature.dispute.repository.DisputeMessageRepository;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisputeServiceImpl implements DisputeService {

    private static final List<DisputeStatus> ACTIVE_STATUSES = List.of(
            DisputeStatus.OPEN,
            DisputeStatus.UNDER_REVIEW
    );

    private final DisputeCaseRepository disputeCaseRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final DisputeMessageRepository disputeMessageRepository;
    private final DisputeFulfillmentPort disputeFulfillmentPort;
    private final OrderService orderService;
    private final MediaAssetService mediaAssetService;
    private final CloudinaryProperties cloudinaryProperties;
    private final MediaUrlBuilder mediaUrlBuilder;
    private final AdminAuditLogService adminAuditLogService;

    @Override
    @Transactional
    public MediaUploadIntentRes createEvidenceUploadIntent(String userId, CreateMediaUploadIntentReq request) {
        String folder = cloudinaryProperties.getBaseFolder().trim() + "/users/" + userId + "/disputes";
        return mediaAssetService.createUploadIntent(
                new MediaUploadContext(
                        userId,
                        MediaUsageType.DISPUTE_EVIDENCE,
                        MediaResourceType.IMAGE,
                        folder,
                        cloudinaryProperties.getUpload().getImageMaxBytes(),
                        "image/"
                ),
                request
        );
    }

    @Override
    @Transactional
    public void confirmEvidenceUpload(String userId, ConfirmMediaUploadReq request) {
        MediaAsset asset = mediaAssetService.confirmOwnedUpload(userId, request);
        if (asset.getUsageType() != MediaUsageType.DISPUTE_EVIDENCE) {
            throw new AppException(ErrorCode.MEDIA_USAGE_TYPE_MISMATCH);
        }
    }

    @Override
    @Transactional
    public DisputeRes openDispute(String buyerId, Long orderId, CreateDisputeReq request) {
        if (disputeCaseRepository
                .findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(orderId, ACTIVE_STATUSES)
                .isPresent()) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_OPEN);
        }

        List<Long> evidenceMediaIds = request.evidenceMediaIds() == null ? List.of() : request.evidenceMediaIds();
        if (evidenceMediaIds.isEmpty()) {
            throw new AppException(ErrorCode.DISPUTE_EVIDENCE_REQUIRED);
        }
        validateEvidenceMedia(buyerId, evidenceMediaIds);

        OrderRes order = orderService.openDispute(buyerId, orderId);
        Long fulfillmentId = order.fulfillment() != null ? order.fulfillment().id() : null;

        DisputeCase dispute = new DisputeCase();
        dispute.setOrderId(orderId);
        dispute.setFulfillmentId(fulfillmentId);
        dispute.setOpenedByUserId(buyerId);
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setReason(request.reason().trim());
        dispute.setDescription(trimToNull(request.description()));
        dispute.setOpenedAt(Instant.now());
        DisputeCase saved = disputeCaseRepository.save(dispute);

        List<DisputeEvidence> evidence = new ArrayList<>();
        for (int i = 0; i < evidenceMediaIds.size(); i++) {
            DisputeEvidence item = new DisputeEvidence();
            item.setDisputeCaseId(saved.getId());
            item.setMediaId(evidenceMediaIds.get(i));
            item.setUploadedByUserId(buyerId);
            item.setSortOrder(i);
            evidence.add(item);
        }
        disputeEvidenceRepository.saveAll(evidence);
        return toRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeRes getCurrentDispute(String userId, Long orderId) {
        orderService.getOrderDetail(userId, orderId);
        return disputeCaseRepository
                .findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(orderId, ACTIVE_STATUSES)
                .map(this::toRes)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputeRes> getDisputeHistory(String userId, Long orderId) {
        orderService.getOrderDetail(userId, orderId);
        List<DisputeCase> disputes = disputeCaseRepository.findByOrderIdOrderByOpenedAtDescIdDesc(orderId);
        return toRes(disputes);
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeDetailRes getDisputeDetail(String userId, Long orderId, Long disputeId) {
        orderService.getOrderDetail(userId, orderId);
        DisputeCase dispute = disputeCaseRepository.findByIdAndOrderId(disputeId, orderId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        return toDetailRes(dispute);
    }

    @Override
    @Transactional
    public DisputeDetailRes addParticipantMessage(
            String userId,
            Long orderId,
            Long disputeId,
            CreateDisputeMessageReq request) {
        DisputeCase dispute = disputeCaseRepository.findByIdForUpdate(disputeId)
                .filter(item -> item.getOrderId().equals(orderId))
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        OrderRes order = orderService.getOrderDetail(userId, orderId);
        DisputeAuthorRole authorRole = participantRole(order, userId);
        ensureActive(dispute);
        createMessage(dispute, userId, authorRole, request);
        return toDetailRes(dispute);
    }

    @Override
    @Transactional
    public DisputeRes cancelDispute(String userId, Long orderId, Long disputeId) {
        DisputeCase dispute = disputeCaseRepository.findByIdForUpdate(disputeId)
                .filter(item -> item.getOrderId().equals(orderId))
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        if (!userId.equals(dispute.getOpenedByUserId())) {
            throw new AppException(ErrorCode.DISPUTE_NOT_OWNED);
        }
        ensureActive(dispute);

        dispute.setStatus(DisputeStatus.CANCELED);
        dispute.setResolvedAt(Instant.now());
        DisputeCase saved = disputeCaseRepository.save(dispute);
        orderService.cancelDispute(orderId);
        return toRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<DisputeRes> getAdminDisputes(String status, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        Page<DisputeCase> disputes;
        if (status == null || status.isBlank()) {
            disputes = disputeCaseRepository.findAllByOrderByOpenedAtDescIdDesc(pageable);
        } else {
            disputes = disputeCaseRepository.findByStatusInOrderByOpenedAtDescIdDesc(
                    List.of(parseStatus(status)),
                    pageable
            );
        }
        List<DisputeRes> mapped = toRes(disputes.getContent());
        return PaginationResponse.of(new PageImpl<>(mapped, pageable, disputes.getTotalElements()));
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeDetailRes getAdminDispute(Long disputeId) {
        return disputeCaseRepository.findById(disputeId)
                .map(this::toDetailRes)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
    }

    @Override
    @Transactional
    public DisputeDetailRes addAdminMessage(
            String adminId,
            Long disputeId,
            CreateDisputeMessageReq request) {
        DisputeCase dispute = disputeCaseRepository.findByIdForUpdate(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        ensureActive(dispute);
        createMessage(dispute, adminId, DisputeAuthorRole.ADMIN, request);
        return toDetailRes(dispute);
    }

    @Override
    @Transactional
    public DisputeRes markUnderReview(String adminId, Long disputeId) {
        DisputeCase dispute = disputeCaseRepository.findByIdForUpdate(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        ensureActive(dispute);
        if (dispute.getStatus() == DisputeStatus.OPEN) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
            dispute = disputeCaseRepository.save(dispute);
            adminAuditLogService.log(
                    adminId,
                    AdminAction.DISPUTE_MARKED_UNDER_REVIEW,
                    AdminTargetType.DISPUTE,
                    String.valueOf(disputeId),
                    null,
                    Map.of("orderId", dispute.getOrderId()));
        }
        return toRes(dispute);
    }

    @Override
    @Transactional
    public DisputeRes resolveDispute(String adminId, Long disputeId, ResolveDisputeReq request) {
        DisputeCase dispute = disputeCaseRepository.findByIdForUpdate(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
        ensureActive(dispute);
        if (request.outcome() == null) {
            throw new AppException(ErrorCode.DISPUTE_RESOLUTION_REQUIRED);
        }
        String resolutionNote = trimToNull(request.resolutionNote());
        if (resolutionNote == null) {
            throw new AppException(ErrorCode.DISPUTE_RESOLUTION_REQUIRED, "Resolution note is required");
        }

        if (request.outcome() == DisputeResolutionOutcome.SELLER_WINS) {
            orderService.resolveDisputeSellerWins(dispute.getOrderId());
            disputeFulfillmentPort.markDisputeSellerWins(dispute.getOrderId());
        } else {
            orderService.resolveDisputeBuyerWins(dispute.getOrderId());
            disputeFulfillmentPort.markDisputeBuyerWins(dispute.getOrderId());
        }

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolvedAt(Instant.now());
        dispute.setResolvedByAdminId(adminId);
        dispute.setResolutionOutcome(request.outcome());
        dispute.setResolutionNote(resolutionNote);
        DisputeCase saved = disputeCaseRepository.save(dispute);
        adminAuditLogService.log(
                adminId,
                AdminAction.DISPUTE_RESOLVED,
                AdminTargetType.DISPUTE,
                String.valueOf(disputeId),
                resolutionNote,
                Map.of(
                        "orderId", dispute.getOrderId(),
                        "outcome", request.outcome().name()));
        return toRes(saved);
    }

    private void validateEvidenceMedia(String ownerUserId, List<Long> mediaIds) {
        Set<Long> seen = new HashSet<>();
        for (Long mediaId : mediaIds) {
            if (mediaId == null || !seen.add(mediaId)) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid dispute evidence media");
            }
            MediaAsset asset = mediaAssetService.getOwnedAssetOrThrow(mediaId, ownerUserId);
            if (asset.getStatus() != MediaStatus.ACTIVE
                    || asset.getUsageType() != MediaUsageType.DISPUTE_EVIDENCE) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Dispute evidence media is not ready");
            }
        }
    }

    private void ensureActive(DisputeCase dispute) {
        if (!ACTIVE_STATUSES.contains(dispute.getStatus())) {
            throw new AppException(ErrorCode.DISPUTE_INVALID_STATUS);
        }
    }

    private DisputeAuthorRole participantRole(OrderRes order, String userId) {
        if (userId.equals(order.buyerId())) {
            return DisputeAuthorRole.BUYER;
        }
        if (userId.equals(order.sellerId())) {
            return DisputeAuthorRole.SELLER;
        }
        throw new AppException(ErrorCode.DISPUTE_NOT_OWNED);
    }

    private void createMessage(
            DisputeCase dispute,
            String authorUserId,
            DisputeAuthorRole authorRole,
            CreateDisputeMessageReq request) {
        String content = trimToNull(request.content());
        List<Long> evidenceMediaIds = request.evidenceMediaIds() == null
                ? List.of()
                : request.evidenceMediaIds();
        if (content == null && evidenceMediaIds.isEmpty()) {
            throw new AppException(ErrorCode.DISPUTE_MESSAGE_REQUIRED);
        }
        validateEvidenceMedia(authorUserId, evidenceMediaIds);

        DisputeMessage message = new DisputeMessage();
        message.setDisputeCaseId(dispute.getId());
        message.setAuthorUserId(authorUserId);
        message.setAuthorRole(authorRole);
        message.setContent(content);
        DisputeMessage savedMessage = disputeMessageRepository.save(message);

        List<DisputeEvidence> evidence = new ArrayList<>();
        for (int i = 0; i < evidenceMediaIds.size(); i++) {
            DisputeEvidence item = new DisputeEvidence();
            item.setDisputeCaseId(dispute.getId());
            item.setMessageId(savedMessage.getId());
            item.setMediaId(evidenceMediaIds.get(i));
            item.setUploadedByUserId(authorUserId);
            item.setSortOrder(i);
            evidence.add(item);
        }
        if (!evidence.isEmpty()) {
            disputeEvidenceRepository.saveAll(evidence);
        }
    }

    private DisputeStatus parseStatus(String status) {
        try {
            return DisputeStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid dispute status");
        }
    }

    private DisputeRes toRes(DisputeCase dispute) {
        List<DisputeEvidenceRes> evidence = disputeEvidenceRepository
                .findByDisputeCaseIdAndMessageIdIsNullOrderBySortOrderAscIdAsc(dispute.getId())
                .stream()
                .map(item -> DisputeEvidenceRes.fromEntity(item, mediaUrlBuilder))
                .toList();
        return DisputeRes.fromEntity(dispute, evidence);
    }

    private DisputeDetailRes toDetailRes(DisputeCase dispute) {
        DisputeRes disputeRes = toRes(dispute);
        List<DisputeMessage> messages = disputeMessageRepository
                .findByDisputeCaseIdOrderByCreatedAtAscIdAsc(dispute.getId());
        if (messages.isEmpty()) {
            return new DisputeDetailRes(disputeRes, List.of());
        }

        List<Long> messageIds = messages.stream().map(DisputeMessage::getId).toList();
        Comparator<DisputeEvidence> evidenceOrder = Comparator
                .comparing(DisputeEvidence::getMessageId)
                .thenComparingInt(DisputeEvidence::getSortOrder)
                .thenComparing(DisputeEvidence::getId, Comparator.nullsLast(Comparator.naturalOrder()));
        Map<Long, List<DisputeEvidenceRes>> evidenceByMessageId = disputeEvidenceRepository
                .findByMessageIdIn(messageIds)
                .stream()
                .sorted(evidenceOrder)
                .collect(Collectors.groupingBy(
                        DisputeEvidence::getMessageId,
                        LinkedHashMap::new,
                        Collectors.mapping(
                                item -> DisputeEvidenceRes.fromEntity(item, mediaUrlBuilder),
                                Collectors.toList())));
        List<DisputeMessageRes> messageResponses = messages.stream()
                .map(message -> DisputeMessageRes.fromEntity(
                        message,
                        evidenceByMessageId.getOrDefault(message.getId(), List.of())))
                .toList();
        return new DisputeDetailRes(disputeRes, messageResponses);
    }

    private List<DisputeRes> toRes(List<DisputeCase> disputes) {
        if (disputes.isEmpty()) {
            return List.of();
        }
        List<Long> disputeIds = disputes.stream().map(DisputeCase::getId).toList();
        Comparator<DisputeEvidence> evidenceOrder = Comparator
                .comparing(DisputeEvidence::getDisputeCaseId)
                .thenComparingInt(DisputeEvidence::getSortOrder)
                .thenComparing(DisputeEvidence::getId, Comparator.nullsLast(Comparator.naturalOrder()));
        Map<Long, List<DisputeEvidenceRes>> evidenceByDisputeId = disputeEvidenceRepository
                .findByDisputeCaseIdInAndMessageIdIsNull(disputeIds)
                .stream()
                .sorted(evidenceOrder)
                .collect(Collectors.groupingBy(
                        DisputeEvidence::getDisputeCaseId,
                        LinkedHashMap::new,
                        Collectors.mapping(
                                item -> DisputeEvidenceRes.fromEntity(item, mediaUrlBuilder),
                                Collectors.toList())));
        return disputes.stream()
                .map(dispute -> DisputeRes.fromEntity(
                        dispute,
                        evidenceByDisputeId.getOrDefault(dispute.getId(), List.of())))
                .toList();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
