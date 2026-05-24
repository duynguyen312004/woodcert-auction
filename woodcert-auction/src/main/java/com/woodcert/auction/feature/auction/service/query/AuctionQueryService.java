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
import com.woodcert.auction.feature.auction.repository.AuctionSessionSpecification;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final ProductRepository productRepository;
    private final AppraisalReportRepository appraisalReportRepository;
    private final CategoryRepository categoryRepository;
    private final SellerSummaryQueryService sellerSummaryQueryService;
    private final ProductImageHelper productImageHelper;
    private final AuctionRuntimeSnapshotService runtimeSnapshotService;
    private final AuctionResponseAssembler responseAssembler;
    private final AuctionPolicy auctionPolicy;

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

        // Bước 4: Ghép ảnh sản phẩm và snapshot runtime vào response chi tiết.
        return responseAssembler.toDetailRes(
                session,
                product,
                productImageHelper.findPrimaryImageUrl(product),
                productImageHelper.findImageUrls(product),
                appraisalReport,
                seller,
                runtimeSnapshotService.loadSnapshot(session));
    }

    @Transactional(readOnly = true)
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size, String status) {
        // Bước 1: Màn quản lý seller ưu tiên phiên mới tạo trước và giới hạn page size.
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        // Bước 2: Chuyển status filter sang enum rồi query phiên theo seller.
        AuctionSessionStatus statusFilter = resolveSellerStatus(status);
        Page<AuctionSession> sessionPage = statusFilter == null
                ? auctionSessionRepository.findByProductSellerId(sellerId, pageable)
                : auctionSessionRepository.findByProductSellerIdAndStatus(sellerId, statusFilter, pageable);
        List<AuctionSession> sessions = sessionPage.getContent();

        // Bước 3: Batch-load product, số người tham gia và runtime snapshot để dựng danh sách.
        Map<Long, Product> productsById = loadProductsById(
                sessions.stream().map(AuctionSession::getProductId).toList());
        Map<Long, Long> participantCounts = loadParticipantCounts(
                sessions.stream().map(AuctionSession::getId).toList());
        Map<Long, AuctionRuntimeSnapshot> snapshots = runtimeSnapshotService.loadSnapshots(sessions);

        // Bước 4: Ghép dữ liệu thành DTO tối ưu cho bảng quản lý của seller.
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
