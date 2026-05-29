package com.woodcert.auction.feature.finance.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.finance.dto.request.CreateDepositReq;
import com.woodcert.auction.feature.finance.dto.response.CreateDepositRes;
import com.woodcert.auction.feature.finance.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class VnPayController {

    private final VnPayService vnPayService;

    /** Tạo URL thanh toán VNPay — yêu cầu xác thực */
    @PostMapping("/api/v1/wallets/me/deposit")
    public ResponseEntity<ApiResponse<CreateDepositRes>> createDeposit(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateDepositReq request,
            HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        // Xử lý IPv6 localhost hoặc rỗng
        if (ipAddress == null || ipAddress.equals("0:0:0:0:0:0:0:1") || ipAddress.equals("127.0.0.1")) {
            ipAddress = "127.0.0.1";
        }
        CreateDepositRes result = vnPayService.createPaymentUrl(userId, request.amount(), ipAddress);
        return ResponseEntity.ok(ApiResponse.success(result, "Payment URL created"));
    }

    /** VNPay redirect user về đây — PUBLIC, không cần JWT */
    @GetMapping("/api/v1/wallets/vnpay/return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String redirectUrl = vnPayService.processReturn(params);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build();
    }

    /** VNPay IPN server-to-server — PUBLIC, không cần JWT */
    @GetMapping("/api/v1/wallets/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        Map<String, String> result = vnPayService.processIpn(params);
        return ResponseEntity.ok(result);
    }
}
