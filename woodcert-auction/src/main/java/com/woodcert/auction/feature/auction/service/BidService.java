package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.dto.response.BidResultRes;

public interface BidService {
    BidResultRes placeBid(String bidderId, CreateBidReq request);
}
