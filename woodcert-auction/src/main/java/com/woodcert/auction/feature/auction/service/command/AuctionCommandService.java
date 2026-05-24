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
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
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
        // Bước 1: Lock sản phẩm để tránh nhiều phiên đấu giá được tạo song song cho cùng sản phẩm.
        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Bước 2: Kiểm tra seller sở hữu sản phẩm và sản phẩm đã được thẩm định hợp lệ.
        auctionPolicy.validateOwnedAppraisedProduct(product, sellerId);

        // Bước 3: Chặn tạo phiên mới nếu sản phẩm đang có phiên WAITING/ACTIVE.
        if (auctionSessionRepository.existsActiveOrWaitingByProductId(product.getId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_CONFLICT);
        }

        // Bước 4: Kiểm tra thời gian, giá khởi điểm, giá sàn, bước giá và tiền cọc theo policy.
        auctionPolicy.validateCreateRequest(request, Instant.now());

        // Bước 5: Tạo phiên đấu giá ở trạng thái WAITING và giá hiện tại bằng giá khởi điểm.
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

        // Bước 6: Lưu phiên, chuyển trạng thái bán của sản phẩm sang IN_AUCTION và trả detail response.
        AuctionSession savedSession = auctionSessionRepository.save(session);
        product.setSaleStatus(ProductSaleStatus.IN_AUCTION);
        productRepository.save(product);
        savedSession.setProduct(product);

        return toDetailRes(savedSession, product);
    }

    @Transactional
    public void cancelAuctionSession(String sellerId, Long auctionId) {
        // Bước 1: Lock phiên đấu giá kèm sản phẩm để kiểm tra quyền và cập nhật trạng thái nhất quán.
        AuctionSession session = auctionSessionRepository.findByIdWithProductForUpdate(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        // Bước 2: Chỉ seller sở hữu sản phẩm mới được hủy phiên.
        Product product = session.getProduct();
        if (product == null || !sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_OWNED);
        }

        // Bước 3: Chỉ cho hủy phiên còn WAITING, không hủy phiên đã ACTIVE/kết thúc.
        if (session.getStatus() != AuctionSessionStatus.WAITING) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_CANCELABLE);
        }

        // Bước 4: Đánh dấu phiên CANCELED và trả sản phẩm về trạng thái có thể tạo phiên khác.
        session.setStatus(AuctionSessionStatus.CANCELED);
        product.setSaleStatus(ProductSaleStatus.AVAILABLE);
    }

    @Transactional
    public void registerForAuction(String userId, Long auctionId) {
        // Bước 1: Lock phiên đấu giá để tránh ghi trùng participant trong lúc đăng ký.
        AuctionSession session = auctionSessionRepository.findByIdWithProductForUpdate(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        // Bước 2: Kiểm tra trạng thái phiên có còn cho đăng ký không.
        AuctionSessionStatus sessionStatus = session.getStatus();
        if (!auctionPolicy.isRegistrableStatus(sessionStatus)) {
            throw new AppException(ErrorCode.AUCTION_SESSION_NOT_REGISTRABLE);
        }

        // Bước 3: Nếu phiên đã ACTIVE thì kiểm tra runtime Redis còn tồn tại và chưa hết hạn.
        if (sessionStatus == AuctionSessionStatus.ACTIVE) {
            validateActiveRegistrationWindow(auctionId);
        }

        // Bước 4: Chặn seller tự đăng ký đấu giá sản phẩm của mình.
        Product product = session.getProduct();
        if (product != null && userId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);
        }

        // Bước 5: Chặn đăng ký trùng trước khi đóng băng tiền cọc.
        if (auctionParticipantRepository.existsByAuctionSessionIdAndUserId(auctionId, userId)) {
            throw new AppException(ErrorCode.AUCTION_ALREADY_REGISTERED);
        }

        // Bước 6: Đóng băng tiền cọc trong ví bằng operation key idempotent theo user và auction.
        String operationKey = "auction:register:freeze:" + auctionId + ":" + userId;
        walletService.freezeFunds(userId, operationKey, session.getDepositAmount(),
                auctionId, WalletReferenceType.AUCTION);

        // Bước 7: Tạo participant với trạng thái tiền cọc FROZEN.
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

        // Bước 8: Nếu phiên đang ACTIVE thì thêm bidder vào runtime Redis để họ có thể đặt giá ngay.
        if (sessionStatus == AuctionSessionStatus.ACTIVE) {
            boolean addedToRuntime = auctionRedisService.addBidder(auctionId, userId);
            if (!addedToRuntime) {
                throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
            }
        }
    }

    private void validateActiveRegistrationWindow(Long auctionId) {
        // Bước 1: Đọc endTime realtime từ Redis vì phiên ACTIVE có thể được anti-sniper gia hạn.
        Long runtimeEndEpochMs = auctionRedisService.getEndTimeEpochMs(auctionId);
        if (runtimeEndEpochMs == null) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }

        // Bước 2: Chỉ cho đăng ký nếu endTime realtime vẫn ở tương lai.
        Instant runtimeEndTime = Instant.ofEpochMilli(runtimeEndEpochMs);
        if (!runtimeEndTime.isAfter(Instant.now())) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }
    }

    private AuctionDetailRes toDetailRes(AuctionSession session, Product product) {
        // Bước 1: Bổ sung báo cáo thẩm định và seller summary cho response chi tiết.
        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        SellerSummaryQueryService.SellerSummary seller = sellerSummaryQueryService
                .findSellerSummary(product.getSellerId())
                .orElse(null);

        // Bước 2: Ghép session, product, ảnh, appraisal và seller thành DTO dùng chung.
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
