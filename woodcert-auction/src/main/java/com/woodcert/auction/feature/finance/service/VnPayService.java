package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.CreateDepositRes;
import com.woodcert.auction.feature.finance.dto.response.VnPayDepositRes;
import java.math.BigDecimal;
import java.util.Map;

public interface VnPayService {
    /** Tạo URL thanh toán VNPay. Lưu bản ghi PENDING. */
    CreateDepositRes createPaymentUrl(String userId, BigDecimal amount, String ipAddress);

    /** Xử lý redirect từ VNPay về backend. Verify checksum → deposit → 302 redirect FE. */
    String processReturn(Map<String, String> params);

    /** Xử lý IPN callback server-to-server từ VNPay. */
    Map<String, String> processIpn(Map<String, String> params);

    /** Lấy lịch sử nạp tiền VNPay của user. */
    PaginationResponse<VnPayDepositRes> getDeposits(String userId, int page, int size);

    /** Lấy trạng thái một giao dịch nạp tiền. */
    VnPayDepositRes getDepositStatus(String userId, String txnRef);
}
