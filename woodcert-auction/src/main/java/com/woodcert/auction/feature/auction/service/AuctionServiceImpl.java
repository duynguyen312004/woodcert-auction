package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionAppraisalRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionProductSummaryRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductImage;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionServiceImpl implements AuctionService {

    private static final BigDecimal MIN_STEP_PRICE = new BigDecimal("100000");
    private static final BigDecimal MIN_DEPOSIT_AMOUNT = new BigDecimal("1000000");
    private static final BigDecimal MAX_DEPOSIT_RATIO = new BigDecimal("0.50");
    private static final Duration MIN_START_LEAD_TIME = Duration.ofMinutes(5);
    private static final Duration MIN_AUCTION_DURATION = Duration.ofHours(1);
    private static final Duration MAX_AUCTION_DURATION = Duration.ofDays(30);
    private static final List<AuctionSessionStatus> DEFAULT_PUBLIC_STATUSES = List.of(
            AuctionSessionStatus.WAITING,
            AuctionSessionStatus.ACTIVE
    );
    private static final Set<AuctionSessionStatus> ALLOWED_PUBLIC_STATUSES = EnumSet.of(
            AuctionSessionStatus.WAITING,
            AuctionSessionStatus.ACTIVE,
            AuctionSessionStatus.ENDED_SUCCESS
    );
    private static final long DEFAULT_PARTICIPANT_COUNT = 0L;

    private final AuctionSessionRepository auctionSessionRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final AppraisalReportRepository appraisalReportRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final ProductImageHelper productImageHelper;

    @Override
    @Transactional
    public AuctionDetailRes createAuctionSession(String sellerId, CreateAuctionSessionReq request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        validateOwnedAppraisedProduct(product, sellerId);

        if (auctionSessionRepository.existsActiveOrWaitingByProductId(product.getId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_CONFLICT);
        }

        Instant now = Instant.now();
        validateTimeRange(request, now);
        validatePriceRules(request);

        AuctionSession session = new AuctionSession();
        session.setProductId(product.getId());
        session.setStartingPrice(request.startingPrice());
        session.setReservePrice(request.reservePrice());
        session.setStepPrice(request.stepPrice());
        session.setDepositAmount(request.depositAmount());
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setCurrentPrice(request.startingPrice());
        session.setStatus(AuctionSessionStatus.WAITING);

        AuctionSession savedSession = auctionSessionRepository.save(session);
        savedSession.setProduct(product);

        log.info("Auction session {} created for product {} by seller {}",
                savedSession.getId(), product.getId(), sellerId);

        return buildAuctionDetailRes(savedSession, product);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<AuctionListRes> getPublicAuctions(int page, int size, String status) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.ASC, "startTime")
        );

        List<AuctionSessionStatus> statuses = resolvePublicStatuses(status);
        Page<AuctionSession> sessionPage = auctionSessionRepository.findAllPublicAuctions(statuses, pageable);

        Map<Long, Product> productsById = loadProductsById(
                sessionPage.getContent().stream().map(AuctionSession::getProductId).toList()
        );
        Map<Long, String> primaryImages = productImageHelper.batchLoadPrimaryImageUrls(productsById.values());

        Page<AuctionListRes> responsePage = new PageImpl<>(
                sessionPage.getContent().stream()
                        .map(session -> buildAuctionListRes(session, productsById.get(session.getProductId()), primaryImages))
                        .toList(),
                pageable,
                sessionPage.getTotalElements()
        );

        return PaginationResponse.of(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionDetailRes getPublicAuctionDetail(Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        validatePublicAuctionVisibility(session);

        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return buildAuctionDetailRes(session, product);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<AuctionSession> sessionPage = auctionSessionRepository.findByProductSellerId(sellerId, pageable);
        Map<Long, Product> productsById = loadProductsById(
                sessionPage.getContent().stream().map(AuctionSession::getProductId).toList()
        );

        Page<SellerAuctionListRes> responsePage = new PageImpl<>(
                sessionPage.getContent().stream()
                        .map(session -> SellerAuctionListRes.fromEntity(
                                session,
                                Optional.ofNullable(productsById.get(session.getProductId()))
                                        .map(Product::getTitle)
                                        .orElse(null),
                                DEFAULT_PARTICIPANT_COUNT
                        ))
                        .toList(),
                pageable,
                sessionPage.getTotalElements()
        );

        return PaginationResponse.of(responsePage);
    }

    @Override
    @Transactional
    public void cancelAuctionSession(String sellerId, Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        Product product = session.getProduct();
        if (product == null || !sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_OWNED);
        }

        if (session.getStatus() != AuctionSessionStatus.WAITING) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_CANCELABLE);
        }

        session.setStatus(AuctionSessionStatus.CANCELED);
        log.info("Auction session {} canceled by seller {}", auctionId, sellerId);
    }

    private void validateOwnedAppraisedProduct(Product product, String sellerId) {
        if (!sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_PRODUCT_NOT_OWNED);
        }

        if (product.getStatus() != ProductStatus.APPRAISED) {
            throw new AppException(ErrorCode.AUCTION_PRODUCT_NOT_APPRAISED);
        }
    }

    private void validateTimeRange(CreateAuctionSessionReq request, Instant now) {
        Instant minimumStartTime = now.plus(MIN_START_LEAD_TIME);
        if (request.startTime().isBefore(minimumStartTime)) {
            throw new AppException(ErrorCode.AUCTION_START_TIME_TOO_SOON);
        }

        Duration duration = Duration.between(request.startTime(), request.endTime());
        if (duration.compareTo(MIN_AUCTION_DURATION) < 0 || duration.compareTo(MAX_AUCTION_DURATION) > 0) {
            throw new AppException(ErrorCode.AUCTION_INVALID_TIME_RANGE);
        }
    }

    private void validatePriceRules(CreateAuctionSessionReq request) {
        if (request.stepPrice().compareTo(MIN_STEP_PRICE) < 0) {
            throw new AppException(ErrorCode.AUCTION_STEP_PRICE_TOO_LOW);
        }

        if (request.reservePrice().compareTo(request.startingPrice()) < 0) {
            throw new AppException(ErrorCode.AUCTION_RESERVE_PRICE_INVALID);
        }

        BigDecimal maxDeposit = request.startingPrice().multiply(MAX_DEPOSIT_RATIO);
        if (request.depositAmount().compareTo(MIN_DEPOSIT_AMOUNT) < 0
                || request.depositAmount().compareTo(maxDeposit) > 0) {
            throw new AppException(ErrorCode.AUCTION_DEPOSIT_AMOUNT_INVALID);
        }
    }

    private void validatePublicAuctionVisibility(AuctionSession session) {
        if (!ALLOWED_PUBLIC_STATUSES.contains(session.getStatus())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND);
        }
    }

    private AuctionListRes buildAuctionListRes(
            AuctionSession session,
            Product product,
            Map<Long, String> primaryImages) {
        AuctionListRes.ProductSummary productSummary = null;
        if (product != null) {
            productSummary = AuctionListRes.ProductSummary.fromEntity(
                    product,
                    primaryImages.get(product.getId())
            );
        }

        return AuctionListRes.fromEntity(session, productSummary, DEFAULT_PARTICIPANT_COUNT);
    }

    private AuctionDetailRes buildAuctionDetailRes(AuctionSession session, Product product) {
        List<ProductImage> productImages = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        List<String> imageUrls = productImages.stream()
                .map(productImageHelper::buildImageUrl)
                .filter(Objects::nonNull)
                .toList();

        String primaryImage = productImages.stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(productImageHelper::buildImageUrl)
                .orElse(imageUrls.isEmpty() ? null : imageUrls.get(0));

        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        AuctionAppraisalRes appraisalRes = AuctionAppraisalRes.fromEntity(appraisalReport);

        String publicMaterial = appraisalReport != null && appraisalReport.getVerifiedMaterial() != null
                ? appraisalReport.getVerifiedMaterial()
                : product.getMaterial();

        AuctionProductSummaryRes productSummary = AuctionProductSummaryRes.fromEntity(
                product,
                publicMaterial,
                primaryImage,
                imageUrls,
                appraisalRes
        );

        User seller = userRepository.findById(product.getSellerId()).orElse(null);
        SellerProfile sellerProfile = sellerProfileRepository.findById(product.getSellerId()).orElse(null);
        AuctionDetailRes.SellerSummary sellerSummary = buildSellerSummary(seller, sellerProfile);

        return AuctionDetailRes.fromEntity(session, productSummary, sellerSummary);
    }

    private AuctionDetailRes.SellerSummary buildSellerSummary(User seller, SellerProfile profile) {
        if (seller == null && profile == null) {
            return null;
        }

        String storeName = profile != null
                ? profile.getStoreName()
                : seller != null ? seller.getFullName() : null;
        BigDecimal reputationScore = profile != null ? profile.getReputationScore() : null;
        return new AuctionDetailRes.SellerSummary(storeName, reputationScore);
    }

    private List<AuctionSessionStatus> resolvePublicStatuses(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return DEFAULT_PUBLIC_STATUSES;
        }

        List<AuctionSessionStatus> statuses = Arrays.stream(statusFilter.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::parseAuctionStatus)
                .distinct()
                .toList();

        if (statuses.isEmpty() || statuses.stream().anyMatch(status -> !ALLOWED_PUBLIC_STATUSES.contains(status))) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid auction status filter: " + statusFilter);
        }

        return statuses;
    }

    private AuctionSessionStatus parseAuctionStatus(String rawStatus) {
        try {
            return AuctionSessionStatus.valueOf(rawStatus.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid auction status: " + rawStatus);
        }
    }

    private Map<Long, Product> loadProductsById(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return StreamSupport.stream(productRepository.findAllById(productIds).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity(), (left, right) -> left, LinkedHashMap::new));
    }
}
