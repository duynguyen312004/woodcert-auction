package com.woodcert.auction.feature.auction.service.query;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class AuctionQueryService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final ProductRepository productRepository;
    private final ProductImageHelper productImageHelper;
    private final AuctionRuntimeSnapshotService runtimeSnapshotService;
    private final AuctionResponseAssembler responseAssembler;
    private final AuctionPolicy auctionPolicy;

    @Transactional(readOnly = true)
    public PaginationResponse<AuctionListRes> getPublicAuctions(int page, int size, String status) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.ASC, "startTime"));

        List<AuctionSessionStatus> statuses = resolvePublicStatuses(status);
        Page<AuctionSession> sessionPage = auctionSessionRepository.findAllPublicAuctions(statuses, pageable);

        List<AuctionSession> sessions = sessionPage.getContent();
        Map<Long, Product> productsById = loadProductsById(
                sessions.stream().map(AuctionSession::getProductId).toList());
        Map<Long, String> primaryImages = productImageHelper.batchLoadPrimaryImageUrls(productsById.values());
        Map<Long, Long> participantCounts = loadParticipantCounts(
                sessions.stream().map(AuctionSession::getId).toList());
        Map<Long, AuctionRuntimeSnapshot> snapshots = runtimeSnapshotService.loadSnapshots(sessions);

        Page<AuctionListRes> responsePage = new PageImpl<>(
                sessions.stream()
                        .map(session -> responseAssembler.toListRes(
                                session,
                                productsById.get(session.getProductId()),
                                primaryImages.get(session.getProductId()),
                                participantCounts.getOrDefault(session.getId(), 0L),
                                snapshots.get(session.getId())))
                        .toList(),
                pageable,
                sessionPage.getTotalElements());

        return PaginationResponse.of(responsePage);
    }

    @Transactional(readOnly = true)
    public AuctionDetailRes getPublicAuctionDetail(Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        if (!auctionPolicy.isPubliclyVisible(session.getStatus())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND);
        }

        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return responseAssembler.toDetailRes(session, product, runtimeSnapshotService.loadSnapshot(session));
    }

    @Transactional(readOnly = true)
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AuctionSession> sessionPage = auctionSessionRepository.findByProductSellerId(sellerId, pageable);
        List<AuctionSession> sessions = sessionPage.getContent();
        Map<Long, Product> productsById = loadProductsById(
                sessions.stream().map(AuctionSession::getProductId).toList());
        Map<Long, Long> participantCounts = loadParticipantCounts(
                sessions.stream().map(AuctionSession::getId).toList());
        Map<Long, AuctionRuntimeSnapshot> snapshots = runtimeSnapshotService.loadSnapshots(sessions);

        Page<SellerAuctionListRes> responsePage = new PageImpl<>(
                sessions.stream()
                        .map(session -> responseAssembler.toSellerListRes(
                                session,
                                java.util.Optional.ofNullable(productsById.get(session.getProductId()))
                                        .map(Product::getTitle)
                                        .orElse(null),
                                participantCounts.getOrDefault(session.getId(), 0L),
                                snapshots.get(session.getId())))
                        .toList(),
                pageable,
                sessionPage.getTotalElements());

        return PaginationResponse.of(responsePage);
    }

    private List<AuctionSessionStatus> resolvePublicStatuses(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return auctionPolicy.defaultPublicStatuses();
        }

        List<AuctionSessionStatus> statuses = Arrays.stream(statusFilter.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(auctionPolicy::parsePublicStatus)
                .distinct()
                .toList();

        if (statuses.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid auction status filter: " + statusFilter);
        }

        return statuses;
    }

    private Map<Long, Product> loadProductsById(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        return StreamSupport.stream(productRepository.findAllById(productIds).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity(), (left, right) -> left,
                        LinkedHashMap::new));
    }

    private Map<Long, Long> loadParticipantCounts(Collection<Long> sessionIds) {
        if (sessionIds == null || sessionIds.isEmpty()) {
            return Map.of();
        }

        return auctionParticipantRepository.countByAuctionSessionIdsGrouped(sessionIds).stream()
                .collect(Collectors.toMap(
                        AuctionParticipantCountView::getAuctionSessionId,
                        AuctionParticipantCountView::getParticipantCount,
                        (left, right) -> left,
                        LinkedHashMap::new));
    }
}
