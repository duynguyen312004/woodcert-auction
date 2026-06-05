package com.woodcert.auction.feature.finance.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.dto.response.VnPayDepositRes;
import com.woodcert.auction.feature.finance.service.VnPayService;
import com.woodcert.auction.feature.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Wallet endpoints for balance read, transaction history, and VNPay deposit flow.
 */
@RestController
@RequestMapping("/api/v1/wallets/me")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final VnPayService vnPayService;

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

    @GetMapping("/deposits")
    public ResponseEntity<ApiResponse<PaginationResponse<VnPayDepositRes>>> getMyDeposits(
            @CurrentUserId String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<VnPayDepositRes> deposits = vnPayService.getDeposits(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(deposits, "Fetch deposits successful"));
    }

    @GetMapping("/deposits/{txnRef}")
    public ResponseEntity<ApiResponse<VnPayDepositRes>> getMyDepositStatus(
            @CurrentUserId String userId,
            @PathVariable String txnRef) {
        VnPayDepositRes deposit = vnPayService.getDepositStatus(userId, txnRef);
        return ResponseEntity.ok(ApiResponse.success(deposit, "Fetch deposit status successful"));
    }
}
