package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.DepositStatus;

/**
 * Projection for seller-facing settlement summary.
 */
public interface AuctionDepositStatusCountView {

    DepositStatus getDepositStatus();

    long getParticipantCount();
}
