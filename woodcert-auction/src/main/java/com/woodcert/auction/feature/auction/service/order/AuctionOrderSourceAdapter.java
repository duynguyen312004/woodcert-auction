package com.woodcert.auction.feature.auction.service.order;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.service.source.OrderSourceAdapter;
import com.woodcert.auction.feature.order.service.source.OrderSourceSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuctionOrderSourceAdapter implements OrderSourceAdapter {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final ProductRepository productRepository;
    private final ProductImageHelper productImageHelper;

    @Override
    public OrderSourceType sourceType() {
        return OrderSourceType.AUCTION;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OrderSourceSnapshot> snapshotForOrderCreation(Long sourceId) {
        AuctionSession session = auctionSessionRepository.findByIdWithProductForUpdate(sourceId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        if (session.getStatus() != AuctionSessionStatus.ENDED_SUCCESS || session.getHighestBidderId() == null) {
            return Optional.empty();
        }

        AuctionParticipant winner = auctionParticipantRepository
                .findByAuctionSessionIdAndUserId(session.getId(), session.getHighestBidderId())
                .filter(participant -> participant.getDepositStatus() == DepositStatus.DEDUCTED)
                .orElse(null);
        if (winner == null) {
            return Optional.empty();
        }

        Product product = session.getProduct();
        if (product == null) {
            product = productRepository.findByIdForUpdate(session.getProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        }

        return Optional.of(new OrderSourceSnapshot(
                OrderSourceType.AUCTION,
                session.getId(),
                session.getHighestBidderId(),
                product.getSellerId(),
                product.getId(),
                product.getTitle(),
                productImageHelper.findPrimaryImageUrl(product),
                session.getCurrentPrice(),
                winner.getDepositAmount()
        ));
    }

    @Override
    @Transactional
    public void onOrderCreated(OrderEntity order) {
        productRepository.findByIdForUpdate(order.getProductId()).ifPresent(product -> {
            product.setSaleStatus(ProductSaleStatus.PENDING_ORDER);
            productRepository.save(product);
        });
    }

    @Override
    @Transactional
    public void onPaymentCanceled(OrderEntity order) {
        auctionParticipantRepository.findByAuctionSessionIdAndUserId(order.getSourceId(), order.getBuyerId())
                .ifPresent(participant -> {
                    participant.setDepositStatus(DepositStatus.CONFISCATED);
                    auctionParticipantRepository.save(participant);
                });
        productRepository.findByIdForUpdate(order.getProductId()).ifPresent(product -> {
            product.setSaleStatus(ProductSaleStatus.AVAILABLE);
            productRepository.save(product);
        });
    }

    @Override
    @Transactional
    public void onShipmentCanceled(OrderEntity order) {
        productRepository.findByIdForUpdate(order.getProductId()).ifPresent(product -> {
            product.setSaleStatus(ProductSaleStatus.AVAILABLE);
            productRepository.save(product);
        });
    }

    @Override
    @Transactional
    public void onOrderCompleted(OrderEntity order) {
        productRepository.findByIdForUpdate(order.getProductId()).ifPresent(product -> {
            product.setSaleStatus(ProductSaleStatus.SOLD);
            productRepository.save(product);
        });
    }

    @Override
    @Transactional
    public void onDisputeBuyerWon(OrderEntity order) {
        productRepository.findByIdForUpdate(order.getProductId()).ifPresent(product -> {
            product.setSaleStatus(ProductSaleStatus.RETURNED);
            productRepository.save(product);
        });
    }
}
