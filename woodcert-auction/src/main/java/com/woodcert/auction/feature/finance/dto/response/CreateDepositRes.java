package com.woodcert.auction.feature.finance.dto.response;

public record CreateDepositRes(
    String paymentUrl,
    String txnRef
) {}
