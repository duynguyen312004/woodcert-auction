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
import com.woodcert.auction.feature.auction.service.assembler.AuctionResponseAssembler;
import com.woodcert.auction.feature.auction.service.policy.AuctionPolicy;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuctionCommandService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final ProductRepository productRepository;
    private final AuctionRedisService auctionRedisService;
    private final AuctionResponseAssembler responseAssembler;
    private final AuctionPolicy auctionPolicy;
    private final WalletService walletService;
    private final ProductImageHelper productImageHelper;
    private final AppraisalReportRepository appraisalReportRepository;
    private final SellerSummaryQueryService sellerSummaryQueryService;

    @Transactional
    public AuctionDetailRes createAuctionSession(String sellerId, CreateAuctionSessionReq request) {
        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        auctionPolicy.validateOwnedAppraisedProduct(product, sellerId);

        if (auctionSessionRepository.existsActiveOrWaitingByProductId(product.getId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_CONFLICT);
        }

        auctionPolicy.validateCreateRequest(request, Instant.now());

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

        return toDetailRes(savedSession, product);
    }

    @Transactional
    public void cancelAuctionSession(String sellerId, Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProductForUpdate(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        Product product = session.getProduct();
        if (product == null || !sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_OWNED);
        }

        if (session.getStatus() != AuctionSessionStatus.WAITING) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_CANCELABLE);
        }

        session.setStatus(AuctionSessionStatus.CANCELED);
    }

    @Transactional
    public void registerForAuction(String userId, Long auctionId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProductForUpdate(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        AuctionSessionStatus sessionStatus = session.getStatus();
        if (!auctionPolicy.isRegistrableStatus(sessionStatus)) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_REGISTRABLE);
        }

        if (sessionStatus == AuctionSessionStatus.ACTIVE) {
            validateActiveRegistrationWindow(auctionId);
        }

        Product product = session.getProduct();
        if (product != null && userId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);
        }

        if (auctionParticipantRepository.existsByAuctionSessionIdAndUserId(auctionId, userId)) {
            throw new AppException(ErrorCode.AUCTION_ALREADY_REGISTERED);
        }

        String operationKey = "auction:register:freeze:" + auctionId + ":" + userId;
        walletService.freezeFunds(userId, operationKey, session.getDepositAmount(),
                auctionId, WalletReferenceType.AUCTION);

        AuctionParticipant participant = new AuctionParticipant();
        participant.setAuctionSessionId(auctionId);
        participant.setUserId(userId);
        participant.setDepositAmount(session.getDepositAmount());
        participant.setDepositStatus(DepositStatus.FROZEN);
        try {
            auctionParticipantRepository.saveAndFlush(participant);
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(ErrorCode.AUCTION_ALREADY_REGISTERED);
        }

        if (sessionStatus == AuctionSessionStatus.ACTIVE) {
            boolean addedToRuntime = auctionRedisService.addBidder(auctionId, userId);
            if (!addedToRuntime) {
                throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
            }
        }
    }

    private void validateActiveRegistrationWindow(Long auctionId) {
        Long runtimeEndEpochMs = auctionRedisService.getEndTimeEpochMs(auctionId);
        if (runtimeEndEpochMs == null) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }

        Instant runtimeEndTime = Instant.ofEpochMilli(runtimeEndEpochMs);
        if (!runtimeEndTime.isAfter(Instant.now())) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }
    }

    private AuctionDetailRes toDetailRes(AuctionSession session, Product product) {
        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        SellerSummaryQueryService.SellerSummary seller = sellerSummaryQueryService
                .findSellerSummary(product.getSellerId())
                .orElse(null);

        return responseAssembler.toDetailRes(
                session,
                product,
                productImageHelper.findPrimaryImageUrl(product),
                productImageHelper.findImageUrls(product),
                appraisalReport,
                seller,
                AuctionRuntimeSnapshot.empty());
    }
}
