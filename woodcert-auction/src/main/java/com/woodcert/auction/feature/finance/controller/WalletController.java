package com.woodcert.auction.feature.finance.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.request.TopUpWalletReq;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Wallet endpoints for balance read, transaction history, and dev/test top-up.
 */
@RestController
@RequestMapping("/api/v1/wallets/me")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<WalletRes>> getMyWallet(@CurrentUserId String userId) {
        WalletRes wallet = walletService.getMyWallet(userId);
        return ResponseEntity.ok(ApiResponse.success(wallet, "Fetch wallet successful"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PaginationResponse<WalletTransactionRes>>> getMyTransactions(
            @CurrentUserId String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<WalletTransactionRes> transactions = walletService.getMyTransactions(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Fetch transactions successful"));
    }

    @PostMapping("/top-up")
    public ResponseEntity<ApiResponse<WalletRes>> topUpWallet(
            @CurrentUserId String userId,
            @RequestBody @Valid TopUpWalletReq request) {
        WalletRes wallet = walletService.topUpWallet(userId, request);
        return ResponseEntity.ok(ApiResponse.success(wallet, "Wallet topped up successfully"));
    }
}
