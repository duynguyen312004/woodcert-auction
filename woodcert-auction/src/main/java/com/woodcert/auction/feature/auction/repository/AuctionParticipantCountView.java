package com.woodcert.auction.feature.auction.repository;

public interface AuctionParticipantCountView {

    Long getAuctionSessionId();

    long getParticipantCount();
}
