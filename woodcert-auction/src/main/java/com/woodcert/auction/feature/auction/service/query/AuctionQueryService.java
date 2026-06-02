package com.woodcert.auction.feature.auction.service.query;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.BidHistoryItemRes;
import com.woodcert.auction.feature.auction.dto.response.MyParticipationRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionStatsRes;
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
import com.woodcert.auction.feature.auction.repository.AuctionSessionSpecification;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Service đọc dữ liệu cho các màn đấu giá.
 *
 * Luồng danh sách/chi tiết public và danh sách seller dùng service này để ghép
 * phiên đấu giá với sản phẩm, ảnh, kiểm định, seller, số người tham gia và giá
 * theo runtime.
 */
@Service
@RequiredArgsConstructor
public class AuctionQueryService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final BidRepository bidRepository;
    private final ProductRepository productRepository;
    private final AppraisalReportRepository appraisalReportRepository;
    private final CategoryRepository categoryRepository;
    private final SellerSummaryQueryService sellerSummaryQueryService;
    private final ProductImageHelper productImageHelper;
    private final AuctionRedisService auctionRedisService;
    private final AuctionRuntimeSnapshotService runtimeSnapshotService;
    private final AuctionResponseAssembler responseAssembler;
    private final AuctionPolicy auctionPolicy;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public PaginationResponse<AuctionListRes> getPublicAuctions(PublicAuctionSearchCriteria criteria) {

        // Bước 1: Chuẩn hóa phân trang và giới hạn page size để phần ghép dữ liệu không quá nặng.
        Pageable pageable = PageRequest.of(
                Math.max(0, criteria.page() - 1),
                Math.min(Math.max(criteria.size(), 1), 50),
                Sort.by(Sort.Direction.ASC, "startTime"));

        // Bước 2: Validate và chuyển các filter từ request sang kiểu dữ liệu dùng cho query.
        validatePriceRange(criteria.priceMin(), criteria.priceMax());

        List<AuctionSessionStatus> statuses = resolvePublicStatuses(criteria.status());
        List<String> materials = parseMaterials(criteria.material());
        Optional<Integer> categoryId = resolveCategoryId(criteria.categoryName());
        if (categoryId.isEmpty() && hasText(criteria.categoryName())) {
            // Tên danh mục không tồn tại thì trả trang rỗng, không query toàn bộ.
            return PaginationResponse.of(new PageImpl<>(List.of(), pageable, 0));
        }

        // Bước 3: Nếu có filter phụ thì dùng specification; nếu không thì dùng query public tối ưu sẵn.
        boolean hasFilter = !materials.isEmpty() || categoryId.isPresent()
                || criteria.priceMin() != null || criteria.priceMax() != null;

        Page<AuctionSession> sessionPage = hasFilter
                ? auctionSessionRepository.findAll(
                        AuctionSessionSpecification.publicAuctionsFilter(
                                statuses, materials, categoryId.orElse(null), criteria.priceMin(), criteria.priceMax()),
                        pageable)
                : auctionSessionRepository.findAllPublicAuctions(statuses, pageable);

        List<AuctionSession> sessions = sessionPage.getContent();

        // Bước 4: Lấy dữ liệu liên quan theo lô để tránh gọi database lặp lại quá nhiều.
        Map<Long, Product> productsById = loadProductsById(
                sessions.stream().map(AuctionSession::getProductId).toList());
        List<Product> products = List.copyOf(productsById.values());
        Map<Long, String> primaryImages = productImageHelper.batchLoadPrimaryImageUrls(productsById.values());
        Map<Long, AppraisalReport> appraisalReports = loadAppraisalReportsByProductId(
                products.stream().map(Product::getId).toList());
        Map<Integer, Category> categories = loadCategoriesById(
                products.stream().map(Product::getCategoryId).toList());
        Map<String, SellerSummaryQueryService.SellerSummary> sellers = sellerSummaryQueryService.findSellerSummaries(
                products.stream().map(Product::getSellerId).toList());
        Map<Long, Long> participantCounts = loadParticipantCounts(
                sessions.stream().map(AuctionSession::getId).toList());
        Map<Long, AuctionRuntimeSnapshot> snapshots = runtimeSnapshotService.loadSnapshots(sessions);

        // Bước 5: Ghép session với product, ảnh, appraisal, seller, participant count và runtime snapshot.
        Page<AuctionListRes> responsePage = new PageImpl<>(
                sessions.stream()
                        .map(session -> toListRes(
                                session,
                                productsById,
                                primaryImages,
                                categories,
                                appraisalReports,
                                sellers,
                                participantCounts,
                                snapshots))
                        .toList(),
                pageable,
                sessionPage.getTotalElements());

        return PaginationResponse.of(responsePage);
    }

    @Transactional(readOnly = true)
    public List<String> getPublicAuctionMaterials() {
        return auctionSessionRepository.findDistinctMaterialsByStatusIn(auctionPolicy.getPubliclyVisibleStatuses());
    }

    @Transactional(readOnly = true)
    public AuctionDetailRes getPublicAuctionDetail(Long auctionId) {
        // Bước 1: Đọc phiên kèm product và chặn các trạng thái không được public.
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        if (!auctionPolicy.isPubliclyVisible(session.getStatus())) {
            // Phiên không public cũng trả không tìm thấy, giống như phiên không tồn tại.
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND);
        }

        // Bước 2: Đảm bảo có product để dựng response, fallback query riêng nếu fetch join chưa có.
        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Bước 3: Lấy appraisal report và seller summary để bổ sung ngữ cảnh cho màn chi tiết.
        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        SellerSummaryQueryService.SellerSummary seller = sellerSummaryQueryService
                .findSellerSummary(product.getSellerId())
                .orElse(null);

        String highestBidderId = session.getStatus() == AuctionSessionStatus.ACTIVE
                ? auctionRedisService.getHighestBidderId(session.getId())
                : null;
        if (highestBidderId == null) {
            highestBidderId = session.getHighestBidderId();
        }
        String highestBidderMaskedAlias = maskUserId(highestBidderId);

        // Bước 4: Ghép ảnh sản phẩm và snapshot runtime vào response chi tiết.
        return responseAssembler.toDetailRes(
                session,
                product,
                productImageHelper.findPrimaryImageUrl(product),
                productImageHelper.findImageUrls(product),
                appraisalReport,
                seller,
                runtimeSnapshotService.loadSnapshot(session),
                highestBidderMaskedAlias);
    }

    @Transactional(readOnly = true)
    public MyParticipationRes getMyParticipation(String userId, Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        if (!auctionPolicy.isPubliclyVisible(session.getStatus())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND);
        }

        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        boolean sellerOwned = userId != null && userId.equals(product.getSellerId());
        Optional<AuctionParticipant> participantOptional =
                auctionParticipantRepository.findByAuctionSessionIdAndUserId(auctionId, userId);
        DepositStatus depositStatus = participantOptional
                .map(AuctionParticipant::getDepositStatus)
                .orElse(null);
        boolean registered = participantOptional.isPresent();
        boolean activeWindowOpen = isActiveWindowOpen(session);
        boolean highestBidder = isCurrentHighestBidder(session, userId);

        ParticipationDecision decision = decideParticipation(
                session.getStatus(), sellerOwned, registered, depositStatus, activeWindowOpen, highestBidder);

        boolean winner = false;
        String outcomeCode = "NONE";
        String outcomeMessage = "";

        if (sellerOwned) {
            outcomeCode = "SELLER_VIEW";
            outcomeMessage = "Seller view of the auction";
        } else {
            if (session.getStatus() == AuctionSessionStatus.WAITING || session.getStatus() == AuctionSessionStatus.ACTIVE) {
                outcomeCode = "NONE";
                outcomeMessage = "Auction is ongoing or waiting";
            } else { // Terminal status (ENDED_SUCCESS, ENDED_FAILED, CANCELED)
                if (!registered) {
                    outcomeCode = "NOT_PARTICIPATED";
                    outcomeMessage = "You did not participate in this auction";
                } else { // Registered
                    if (session.getStatus() == AuctionSessionStatus.ENDED_FAILED || session.getStatus() == AuctionSessionStatus.CANCELED) {
                        outcomeCode = "ENDED_FAILED";
                        outcomeMessage = "Auction ended failed";
                    } else if (session.getStatus() == AuctionSessionStatus.ENDED_SUCCESS) {
                        if (depositStatus == DepositStatus.DEDUCTED) {
                            outcomeCode = "WINNER";
                            winner = true;
                            outcomeMessage = "You won this auction";
                        } else if (depositStatus == DepositStatus.REFUNDED) {
                            outcomeCode = "LOSER";
                            outcomeMessage = "You did not win this auction";
                        } else if (depositStatus == DepositStatus.FROZEN) {
                            outcomeCode = "PENDING_SETTLEMENT";
                            outcomeMessage = "Settlement is pending";
                        } else {
                            outcomeCode = "PENDING_SETTLEMENT";
                            outcomeMessage = "Settlement is pending";
                        }
                    }
                }
            }
        }

        return new MyParticipationRes(
                sellerOwned,
                registered,
                depositStatus,
                highestBidder,
                decision.canRegister(),
                decision.canBid(),
                decision.reasonCode(),
                decision.reasonMessage(),
                session.getDepositAmount(),
                winner,
                outcomeCode,
                outcomeMessage);
    }

    @Transactional(readOnly = true)
    public List<BidHistoryItemRes> getBidHistory(Long auctionId, int size, String currentUserId) {
        AuctionSession session = auctionSessionRepository.findById(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        if (!auctionPolicy.isPubliclyVisible(session.getStatus())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(0, Math.min(Math.max(size, 1), 50));
        return bidRepository
                .findByAuctionSessionIdAndStatusOrderByBidTimeDesc(auctionId, BidStatus.VALID, pageable)
                .stream()
                .map(bid -> toBidHistoryItem(bid, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size, String status) {
        // Bước 1: Màn quản lý seller ưu tiên phiên mới tạo trước và giới hạn page size.
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        // Bước 2: Chuyển status filter sang enum rồi query phiên theo seller.
        // findByProductSellerId/findByProductSellerIdAndStatus đã có JOIN FETCH a.product
        // nên không cần gọi loadProductsById() bổ sung.
        AuctionSessionStatus statusFilter = resolveSellerStatus(status);
        Page<AuctionSession> sessionPage = statusFilter == null
                ? auctionSessionRepository.findByProductSellerId(sellerId, pageable)
                : auctionSessionRepository.findByProductSellerIdAndStatus(sellerId, statusFilter, pageable);
        List<AuctionSession> sessions = sessionPage.getContent();

        // Bước 3: Batch-load ảnh, số người tham gia và runtime snapshot để dựng danh sách.
        // Product lấy trực tiếp từ session.getProduct() nhờ JOIN FETCH ở query.
        Map<Long, String> primaryImages = productImageHelper.batchLoadPrimaryImageUrls(
                sessions.stream()
                        .map(AuctionSession::getProduct)
                        .filter(java.util.Objects::nonNull)
                        .toList());
        Map<Long, Long> participantCounts = loadParticipantCounts(
                sessions.stream().map(AuctionSession::getId).toList());
        Map<Long, AuctionRuntimeSnapshot> snapshots = runtimeSnapshotService.loadSnapshots(sessions);

        // Bước 4: Ghép dữ liệu thành DTO tối ưu cho bảng quản lý của seller.
        Page<SellerAuctionListRes> responsePage = new PageImpl<>(
                sessions.stream()
                        .map(session -> {
                            Product product = session.getProduct();
                            String title = product != null ? product.getTitle() : null;
                            String imageUrl = product != null ? primaryImages.get(product.getId()) : null;
                            return responseAssembler.toSellerListRes(
                                    session,
                                    title,
                                    imageUrl,
                                    participantCounts.getOrDefault(session.getId(), 0L),
                                    snapshots.get(session.getId()));
                        })
                        .toList(),
                pageable,
                sessionPage.getTotalElements());

        return PaginationResponse.of(responsePage);
    }

    @Transactional(readOnly = true)
    public SellerAuctionStatsRes getSellerAuctionStats(String sellerId) {
        // GROUP BY query trả về list [AuctionSessionStatus, Long] — chỉ có các trạng thái tồn tại.
        List<Object[]> rows = auctionSessionRepository.countBySellerIdGroupByStatus(sellerId);
        Map<AuctionSessionStatus, Long> counts = rows.stream()
                .collect(Collectors.toMap(
                        row -> (AuctionSessionStatus) row[0],
                        row -> (Long) row[1],
                        (left, right) -> left));
        return new SellerAuctionStatsRes(
                counts.getOrDefault(AuctionSessionStatus.WAITING, 0L),
                counts.getOrDefault(AuctionSessionStatus.ACTIVE, 0L),
                counts.getOrDefault(AuctionSessionStatus.ENDED_SUCCESS, 0L),
                counts.getOrDefault(AuctionSessionStatus.ENDED_FAILED, 0L),
                counts.getOrDefault(AuctionSessionStatus.CANCELED, 0L)
        );
    }

    @Transactional(readOnly = true)
    public SellerAuctionDetailRes getSellerAuctionDetail(String sellerId, Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_OWNED);
        }

        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        AuctionRuntimeSnapshot snapshot = runtimeSnapshotService.loadSnapshot(session);
        Map<DepositStatus, Long> depositCounts = loadDepositStatusCounts(auctionId);
        SellerAuctionDetailRes.SettlementSummary settlement = new SellerAuctionDetailRes.SettlementSummary(
                depositCounts.getOrDefault(DepositStatus.FROZEN, 0L),
                depositCounts.getOrDefault(DepositStatus.REFUNDED, 0L),
                depositCounts.getOrDefault(DepositStatus.DEDUCTED, 0L),
                depositCounts.getOrDefault(DepositStatus.CONFISCATED, 0L));
        long participantCount = depositCounts.values().stream().mapToLong(Long::longValue).sum();
        var order = orderService.findSummaryBySource(OrderSourceType.AUCTION, auctionId);

        return responseAssembler.toSellerDetailRes(
                session,
                product,
                productImageHelper.findPrimaryImageUrl(product),
                productImageHelper.findImageUrls(product),
                appraisalReport,
                participantCount,
                settlement,
                resolveSettlementStatus(session.getStatus(), settlement),
                maskUserId(session.getHighestBidderId()),
                order,
                snapshot);
    }

    private AuctionSessionStatus resolveSellerStatus(String statusFilter) {
        if (!hasText(statusFilter)) {
            return null;
        }

        try {
            return AuctionSessionStatus.valueOf(statusFilter.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid auction status filter: " + statusFilter);
        }
    }

    private List<String> parseMaterials(String material) {
        if (material == null || material.isBlank()) {
            return List.of();
        }
        return Arrays.stream(material.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    /**
     * Đổi tên danh mục từ UI sang id trong database để dùng cho specification.
     */
    private Optional<Integer> resolveCategoryId(String categoryName) {
        if (!hasText(categoryName)) {
            return Optional.empty();
        }
        return categoryRepository.findByNameIgnoreCase(categoryName.trim())
                .map(com.woodcert.auction.feature.catalog.entity.Category::getId)
                .or(Optional::empty);
    }

    private void validatePriceRange(BigDecimal priceMin, BigDecimal priceMax) {
        if (priceMin != null && priceMax != null && priceMin.compareTo(priceMax) > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "priceMin must be less than or equal to priceMax");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
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

    /**
     * Load product theo lô và giữ bản ghi đầu tiên nếu có id bị lặp.
     */
    private Map<Long, Product> loadProductsById(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        return StreamSupport.stream(productRepository.findAllById(productIds).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity(), (left, right) -> left,
                        LinkedHashMap::new));
    }

    private Map<Long, AppraisalReport> loadAppraisalReportsByProductId(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        return appraisalReportRepository.findByProductIdIn(productIds).stream()
                .collect(Collectors.toMap(
                        AppraisalReport::getProductId,
                        Function.identity(),
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private Map<Integer, Category> loadCategoriesById(Collection<Integer> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = categoryIds.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return StreamSupport.stream(categoryRepository.findAllById(ids).spliterator(), false)
                .collect(Collectors.toMap(Category::getId, Function.identity(), (left, right) -> left,
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

    /**
     * Bước cuối để gom dữ liệu thành response cho card đấu giá public.
     */
    private Map<DepositStatus, Long> loadDepositStatusCounts(Long auctionId) {
        if (auctionId == null) {
            return Map.of();
        }

        return auctionParticipantRepository.countDepositStatusByAuctionSessionId(auctionId).stream()
                .collect(Collectors.toMap(
                        AuctionDepositStatusCountView::getDepositStatus,
                        AuctionDepositStatusCountView::getParticipantCount,
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private SellerAuctionDetailRes.SellerAuctionSettlementStatus resolveSettlementStatus(
            AuctionSessionStatus status,
            SellerAuctionDetailRes.SettlementSummary settlement) {
        if (status != AuctionSessionStatus.ENDED_SUCCESS && status != AuctionSessionStatus.ENDED_FAILED) {
            return SellerAuctionDetailRes.SellerAuctionSettlementStatus.NOT_APPLICABLE;
        }

        return settlement.frozen() > 0
                ? SellerAuctionDetailRes.SellerAuctionSettlementStatus.PENDING
                : SellerAuctionDetailRes.SellerAuctionSettlementStatus.SETTLED;
    }

    private String maskUserId(String userId) {
        if (userId == null || userId.length() < 4) {
            return null;
        }
        return userId.substring(0, 4) + "****";
    }

    private boolean isActiveWindowOpen(AuctionSession session) {
        if (session.getStatus() != AuctionSessionStatus.ACTIVE) {
            return false;
        }

        Long runtimeEndEpochMs = auctionRedisService.getEndTimeEpochMs(session.getId());
        return runtimeEndEpochMs != null && Instant.ofEpochMilli(runtimeEndEpochMs).isAfter(Instant.now());
    }

    private boolean isCurrentHighestBidder(AuctionSession session, String userId) {
        if (userId == null || session == null) {
            return false;
        }

        String highestBidderId = session.getStatus() == AuctionSessionStatus.ACTIVE
                ? auctionRedisService.getHighestBidderId(session.getId())
                : null;
        if (highestBidderId == null) {
            highestBidderId = session.getHighestBidderId();
        }

        return userId.equals(highestBidderId);
    }

    private ParticipationDecision decideParticipation(AuctionSessionStatus status,
                                                      boolean sellerOwned,
                                                      boolean registered,
                                                      DepositStatus depositStatus,
                                                      boolean activeWindowOpen,
                                                      boolean highestBidder) {
        if (sellerOwned) {
            return blocked("SELLER_OWN_AUCTION", "Seller cannot participate in their own auction");
        }

        if (registered) {
            if (depositStatus == DepositStatus.FROZEN && status == AuctionSessionStatus.ACTIVE
                    && activeWindowOpen && highestBidder) {
                return blocked("CURRENT_HIGHEST_BIDDER", "You are currently the highest bidder");
            }
            if (depositStatus == DepositStatus.FROZEN && status == AuctionSessionStatus.ACTIVE && activeWindowOpen) {
                return new ParticipationDecision(false, true, "CAN_BID", "You can place bids in this auction");
            }
            if (depositStatus == DepositStatus.FROZEN && status == AuctionSessionStatus.WAITING) {
                return blocked("WAITING_FOR_ACTIVATION", "You are registered and waiting for the auction to start");
            }
            if (depositStatus == DepositStatus.FROZEN && status == AuctionSessionStatus.ACTIVE) {
                return blocked("AUCTION_RUNTIME_UNAVAILABLE", "Auction runtime is not available for bidding");
            }
            if (depositStatus == DepositStatus.REFUNDED) {
                return blocked("DEPOSIT_REFUNDED", "Your deposit has been refunded");
            }
            if (depositStatus == DepositStatus.DEDUCTED) {
                return blocked("DEPOSIT_DEDUCTED", "Your deposit has been deducted as the winner deposit");
            }
            if (depositStatus == DepositStatus.CONFISCATED) {
                return blocked("DEPOSIT_CONFISCATED", "Your deposit has been confiscated");
            }
            return blocked("ALREADY_REGISTERED", "You have already registered for this auction");
        }

        if (status == AuctionSessionStatus.WAITING) {
            return new ParticipationDecision(true, false, "CAN_REGISTER", "You can register for this auction");
        }
        if (status == AuctionSessionStatus.ACTIVE && activeWindowOpen) {
            return new ParticipationDecision(true, false, "CAN_REGISTER", "You can register and join this active auction");
        }
        if (status == AuctionSessionStatus.ACTIVE) {
            return blocked("AUCTION_RUNTIME_UNAVAILABLE", "Auction runtime is not available for registration");
        }
        if (status == AuctionSessionStatus.ENDED_SUCCESS || status == AuctionSessionStatus.ENDED_FAILED) {
            return blocked("AUCTION_ENDED", "Auction session has ended");
        }

        return blocked("AUCTION_NOT_REGISTRABLE", "Auction session is not open for registration");
    }

    private ParticipationDecision blocked(String reasonCode, String reasonMessage) {
        return new ParticipationDecision(false, false, reasonCode, reasonMessage);
    }

    private BidHistoryItemRes toBidHistoryItem(Bid bid, String currentUserId) {
        return new BidHistoryItemRes(
                bid.getBidTraceId(),
                bid.getBidAmount(),
                maskBidderAlias(bid.getUserId()),
                bid.getBidTime(),
                currentUserId != null && currentUserId.equals(bid.getUserId()));
    }

    private String maskBidderAlias(String userId) {
        if (userId == null || userId.length() < 4) {
            return "****";
        }
        return userId.substring(0, 4) + "****";
    }

    private record ParticipationDecision(
            boolean canRegister,
            boolean canBid,
            String reasonCode,
            String reasonMessage
    ) {
    }

    private AuctionListRes toListRes(
            AuctionSession session,
            Map<Long, Product> productsById,
            Map<Long, String> primaryImages,
            Map<Integer, Category> categories,
            Map<Long, AppraisalReport> appraisalReports,
            Map<String, SellerSummaryQueryService.SellerSummary> sellers,
            Map<Long, Long> participantCounts,
            Map<Long, AuctionRuntimeSnapshot> snapshots) {
        Product product = productsById.get(session.getProductId());
        String categoryName = Optional.ofNullable(product)
                .map(Product::getCategoryId)
                .map(categories::get)
                .map(Category::getName)
                .orElse(null);
        SellerSummaryQueryService.SellerSummary seller = Optional.ofNullable(product)
                .map(Product::getSellerId)
                .map(sellers::get)
                .orElse(null);

        return responseAssembler.toListRes(
                session,
                product,
                primaryImages.get(session.getProductId()),
                categoryName,
                appraisalReports.get(session.getProductId()),
                seller,
                participantCounts.getOrDefault(session.getId(), 0L),
                snapshots.get(session.getId()));
    }
}
