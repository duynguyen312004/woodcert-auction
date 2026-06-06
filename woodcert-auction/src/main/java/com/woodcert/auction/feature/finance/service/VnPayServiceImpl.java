package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.VnPayProperties;
import com.woodcert.auction.feature.finance.dto.response.CreateDepositRes;
import com.woodcert.auction.feature.finance.dto.response.VnPayDepositRes;
import com.woodcert.auction.feature.finance.entity.VnPayDeposit;
import com.woodcert.auction.feature.finance.entity.VnPayDepositStatus;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.repository.VnPayDepositRepository;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VnPayServiceImpl implements VnPayService {

    private final VnPayProperties properties;
    private final VnPayDepositRepository depositRepository;
    private final WalletService walletService;
    private final TransactionTemplate transactionTemplate;

    private static final String VERSION = "2.1.0";
    private static final String COMMAND = "pay";
    private static final String CURR_CODE = "VND";
    private static final String ORDER_TYPE = "other";
    private static final String LOCALE = "vn";
    private static final String VNPAY_SUCCESS_CODE = "00";
    private static final Charset VNPAY_CHARSET = StandardCharsets.US_ASCII;
    private static final int TXN_REF_MAX_ATTEMPTS = 3;

    @Override
    @Transactional
    public CreateDepositRes createPaymentUrl(String userId, BigDecimal amount, String ipAddress) {
        if (amount == null || amount.compareTo(BigDecimal.valueOf(10000)) < 0) {
            throw new AppException(ErrorCode.WALLET_AMOUNT_INVALID, "Số tiền nạp tối thiểu là 10,000 VND");
        }

        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = now.format(formatter);
        VnPayDeposit deposit = createPendingDeposit(userId, amount, timestamp);
        String txnRef = deposit.getTxnRef();

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", VERSION);
        vnpParams.put("vnp_Command", COMMAND);
        vnpParams.put("vnp_TmnCode", properties.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        vnpParams.put("vnp_CurrCode", CURR_CODE);
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", deposit.getOrderInfo());
        vnpParams.put("vnp_OrderType", ORDER_TYPE);
        vnpParams.put("vnp_Locale", LOCALE);
        vnpParams.put("vnp_ReturnUrl", properties.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress);
        vnpParams.put("vnp_CreateDate", timestamp);
        vnpParams.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // VNPay 2.1.0 signs sorted key=value pairs with URL-encoded values.
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, VNPAY_CHARSET));

                // Keep Java URLEncoder output as-is because VNPay expects spaces as '+'.
                query.append(URLEncoder.encode(fieldName, VNPAY_CHARSET));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, VNPAY_CHARSET));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = hmacSHA512(properties.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = properties.getPayUrl() + "?" + queryUrl;

        log.info("Created payment URL for user {}, txnRef={}", userId, txnRef);
        return new CreateDepositRes(paymentUrl, txnRef);
    }

    private VnPayDeposit createPendingDeposit(String userId, BigDecimal amount, String timestamp) {
        for (int attempt = 1; attempt <= TXN_REF_MAX_ATTEMPTS; attempt++) {
            String txnRef = "DEP" + timestamp
                    + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            VnPayDeposit deposit = new VnPayDeposit();
            deposit.setUserId(userId);
            deposit.setTxnRef(txnRef);
            deposit.setAmount(amount);
            deposit.setOrderInfo("Nap tien vi WoodCert " + txnRef);
            deposit.setStatus(VnPayDepositStatus.PENDING);

            try {
                return depositRepository.saveAndFlush(deposit);
            } catch (DataIntegrityViolationException ex) {
                if (attempt == TXN_REF_MAX_ATTEMPTS) {
                    throw ex;
                }
                log.warn("VNPay txnRef collision on attempt {}; retrying", attempt);
            }
        }
        throw new IllegalStateException("Unable to create unique VNPay transaction reference");
    }

    @Override
    @Transactional
    public String processReturn(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        String txnRef = params.get("vnp_TxnRef");

        if (!hasText(txnRef) || !hasText(secureHash)) {
            log.warn("VNPay return callback missing required params. TxnRef={}", txnRef);
            return properties.getFeReturnUrl() + "?status=FAILED&reason=MISSING_PARAMS";
        }

        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String localHash = calculateChecksum(fields);
        if (!localHash.equalsIgnoreCase(secureHash)) {
            log.error("Invalid VNPay return checksum. TxnRef={}", txnRef);
            return properties.getFeReturnUrl() + "?txnRef=" + txnRef + "&status=FAILED&reason=INVALID_CHECKSUM";
        }

        if (isConfirmOnReturnAllowed()) {
            try {
                transactionTemplate.executeWithoutResult(status -> confirmDeposit(params, "ReturnUrl"));
            } catch (Exception ex) {
                log.error("VNPay ReturnUrl local confirmation error for txnRef={}", txnRef, ex);
                return properties.getFeReturnUrl() + "?txnRef=" + txnRef + "&status=FAILED&reason=SYSTEM_ERROR";
            }
        }

        VnPayDeposit deposit = depositRepository.findByTxnRef(txnRef).orElse(null);
        if (deposit == null) {
            log.error("VnPayDeposit not found for txnRef={}", txnRef);
            return properties.getFeReturnUrl() + "?txnRef=" + txnRef + "&status=FAILED&reason=ORDER_NOT_FOUND";
        }

        return properties.getFeReturnUrl() + "?txnRef=" + txnRef + "&status=" + deposit.getStatus().name();
    }

    @Override
    public Map<String, String> processIpn(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        String txnRef = params.get("vnp_TxnRef");

        if (!hasText(txnRef) || !hasText(secureHash)) {
            log.warn("VNPay IPN callback missing required params. TxnRef={}", txnRef);
            return ipnResponse("99", "Input required value is invalid / System Error");
        }

        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String localHash = calculateChecksum(fields);
        if (!localHash.equalsIgnoreCase(secureHash)) {
            log.error("Invalid VNPay IPN checksum. TxnRef={}", txnRef);
            return ipnResponse("97", "Invalid Checksum");
        }

        try {
            Map<String, String> response = transactionTemplate.execute(status -> confirmDeposit(params, "IPN"));
            return response != null ? response : ipnResponse("99", "Input required value is invalid / System Error");
        } catch (Exception ex) {
            log.error("VNPay IPN system error for txnRef={}", txnRef, ex);
            return ipnResponse("99", "Input required value is invalid / System Error");
        }
    }

    private Map<String, String> confirmDeposit(Map<String, String> params, String source) {
        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String transactionNo = params.get("vnp_TransactionNo");
        String bankCode = params.get("vnp_BankCode");

        VnPayDeposit deposit = depositRepository.findByTxnRefForUpdate(txnRef).orElse(null);
        if (deposit == null) {
            log.error("VNPay {} order not found for txnRef={}", source, txnRef);
            return ipnResponse("01", "Order not found");
        }

        if (!Objects.equals(properties.getTmnCode(), params.get("vnp_TmnCode"))) {
            log.error("VNPay {} TmnCode mismatch for txnRef={}", source, txnRef);
            return ipnResponse("99", "Input required value is invalid / System Error");
        }

        if (!isAmountMatched(params.get("vnp_Amount"), deposit.getAmount())) {
            log.error("VNPay {} amount mismatch for txnRef={}", source, txnRef);
            return ipnResponse("04", "Invalid Amount");
        }

        if (deposit.getStatus() == VnPayDepositStatus.SUCCESS || deposit.getStatus() == VnPayDepositStatus.FAILED) {
            log.info("VNPay {} order already confirmed for txnRef={}", source, txnRef);
            return ipnResponse("02", "Order already confirmed");
        }

        deposit.setVnpResponseCode(responseCode);
        deposit.setVnpBankCode(bankCode);

        if (VNPAY_SUCCESS_CODE.equals(responseCode) && VNPAY_SUCCESS_CODE.equals(transactionStatus)) {
            deposit.setStatus(VnPayDepositStatus.SUCCESS);
            deposit.setVnpTransactionNo(transactionNo);
            deposit.setPaidAt(Instant.now());
            depositRepository.saveAndFlush(deposit);

            walletService.depositFunds(
                    deposit.getUserId(),
                    FinanceOperationKeys.vnpayDeposit(txnRef),
                    deposit.getAmount(),
                    deposit.getId(),
                    WalletReferenceType.VNPAY_DEPOSIT);
            log.info("VNPay {} confirmation success for txnRef={}", source, txnRef);
        } else {
            deposit.setStatus(VnPayDepositStatus.FAILED);
            depositRepository.saveAndFlush(deposit);
            log.info("VNPay {} transaction failed for txnRef={}, code={}", source, txnRef, responseCode);
        }

        return ipnResponse("00", "Confirm Success");
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<VnPayDepositRes> getDeposits(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        Page<VnPayDepositRes> depositPage = depositRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(VnPayDepositRes::fromEntity);
        return PaginationResponse.of(depositPage);
    }

    @Override
    @Transactional(readOnly = true)
    public VnPayDepositRes getDepositStatus(String userId, String txnRef) {
        VnPayDeposit deposit = depositRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy giao dịch"));

        if (!deposit.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Bạn không có quyền xem thông tin giao dịch này");
        }

        return VnPayDepositRes.fromEntity(deposit);
    }

    private boolean isConfirmOnReturnAllowed() {
        if (!properties.isConfirmOnReturnEnabled()) {
            return false;
        }
        try {
            String host = URI.create(properties.getReturnUrl()).getHost();
            return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host);
        } catch (Exception ex) {
            log.warn("VNPay confirm-on-return disabled because return-url is invalid");
            return false;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String calculateChecksum(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                sb.append(fieldName);
                sb.append("=");
                // Spring gives decoded request params; encode values again before verifying.
                sb.append(URLEncoder.encode(fieldValue, VNPAY_CHARSET));
                if (itr.hasNext()) {
                    sb.append("&");
                }
            }
        }
        return hmacSHA512(properties.getHashSecret(), sb.toString());
    }

    private boolean isAmountMatched(String vnpAmount, BigDecimal depositAmount) {
        if (vnpAmount == null || depositAmount == null) {
            return false;
        }
        try {
            BigDecimal expectedAmount = depositAmount.multiply(BigDecimal.valueOf(100));
            return new BigDecimal(vnpAmount).compareTo(expectedAmount) == 0;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private Map<String, String> ipnResponse(String code, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", code);
        response.put("Message", message);
        return response;
    }

    private String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("Error signing HMAC SHA512", ex);
            return "";
        }
    }
}
