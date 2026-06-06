package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.finance.config.VnPayProperties;
import com.woodcert.auction.feature.finance.dto.response.CreateDepositRes;
import com.woodcert.auction.feature.finance.entity.VnPayDeposit;
import com.woodcert.auction.feature.finance.entity.VnPayDepositStatus;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.repository.VnPayDepositRepository;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnPayServiceImplTest {

    @Mock
    private VnPayProperties properties;

    @Mock
    private VnPayDepositRepository depositRepository;

    @Mock
    private WalletService walletService;

    @Mock
    private PlatformTransactionManager transactionManager;

    private VnPayServiceImpl vnPayService;

    private static final String USER_ID = "user-123";
    private static final String HASH_SECRET = "MY_SECRET_KEY_1234567890";
    private static final String PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private static final String RETURN_URL = "http://localhost:8080/api/v1/wallets/vnpay/return";
    private static final String FE_RETURN_URL = "http://localhost:5173/wallet/deposit/result";
    private static final String TMN_CODE = "MN123456";

    @BeforeEach
    void setUp() {
        lenient().when(properties.getHashSecret()).thenReturn(HASH_SECRET);
        lenient().when(properties.getPayUrl()).thenReturn(PAY_URL);
        lenient().when(properties.getReturnUrl()).thenReturn(RETURN_URL);
        lenient().when(properties.getFeReturnUrl()).thenReturn(FE_RETURN_URL);
        lenient().when(properties.getTmnCode()).thenReturn(TMN_CODE);
        lenient().when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        lenient().when(depositRepository.saveAndFlush(any(VnPayDeposit.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        vnPayService = new VnPayServiceImpl(
                properties,
                depositRepository,
                walletService,
                new TransactionTemplate(transactionManager)
        );
    }

    @Test
    @DisplayName("should create payment URL successfully and save pending deposit")
    void createPaymentUrl_success() {
        BigDecimal amount = BigDecimal.valueOf(50000);
        String ipAddress = "127.0.0.1";

        CreateDepositRes res = vnPayService.createPaymentUrl(USER_ID, amount, ipAddress);

        assertThat(res.paymentUrl()).startsWith(PAY_URL);
        assertThat(res.txnRef()).startsWith("DEP");
        assertThat(res.paymentUrl()).contains("vnp_OrderInfo=Nap+tien+vi+WoodCert+" + res.txnRef());
        assertThat(res.paymentUrl()).doesNotContain("Nap%20tien");

        Map<String, String> queryParams = queryParams(res.paymentUrl());
        String secureHash = queryParams.remove("vnp_SecureHash");
        assertThat(secureHash).isEqualTo(calculateTestChecksum(queryParams));

        ArgumentCaptor<VnPayDeposit> depositCaptor = ArgumentCaptor.forClass(VnPayDeposit.class);
        verify(depositRepository).saveAndFlush(depositCaptor.capture());

        VnPayDeposit saved = depositCaptor.getValue();
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getAmount()).isEqualTo(amount);
        assertThat(saved.getStatus()).isEqualTo(VnPayDepositStatus.PENDING);
        assertThat(saved.getTxnRef()).isEqualTo(res.txnRef());
    }

    @Test
    @DisplayName("should reject payment amount less than 10,000 VND")
    void createPaymentUrl_amountTooLow_throwsException() {
        BigDecimal amount = BigDecimal.valueOf(9999);
        String ipAddress = "127.0.0.1";

        assertThatThrownBy(() -> vnPayService.createPaymentUrl(USER_ID, amount, ipAddress))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("10,000 VND");

        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should redirect to FAILED on processReturn if checksum is invalid")
    void processReturn_invalidChecksum_redirectsToFailed() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "DEP123");
        params.put("vnp_SecureHash", "invalid_hash");

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).contains("status=FAILED").contains("reason=INVALID_CHECKSUM");
        verifyNoInteractions(walletService);
    }

    @Test
    @DisplayName("should redirect to FAILED on processReturn if required params are missing")
    void processReturn_missingRequiredParams_redirectsToFailed() {
        String redirectUrl = vnPayService.processReturn(new HashMap<>());

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?status=FAILED&reason=MISSING_PARAMS");
        verifyNoInteractions(walletService);
        verifyNoInteractions(depositRepository);
    }

    @Test
    @DisplayName("should not mutate wallet on processReturn even when VNPay response is successful")
    void processReturn_validChecksum_successDoesNotDepositFunds() {
        String txnRef = "DEP20260526000001";
        VnPayDeposit deposit = pendingDeposit(1L, txnRef);
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=PENDING");
        assertThat(deposit.getStatus()).isEqualTo(VnPayDepositStatus.PENDING);
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should redirect current deposit status on processReturn")
    void processReturn_validChecksum_redirectsCurrentStatus() {
        String txnRef = "DEP20260526000002";
        VnPayDeposit deposit = pendingDeposit(2L, txnRef);
        deposit.setStatus(VnPayDepositStatus.SUCCESS);
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=SUCCESS");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("should confirm and deposit funds on processReturn when local confirmation is enabled")
    void processReturn_localConfirmationEnabled_successDepositsFunds() {
        lenient().when(properties.isConfirmOnReturnEnabled()).thenReturn(true);
        String txnRef = "DEP20260526000009";
        VnPayDeposit deposit = pendingDeposit(9L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=SUCCESS");
        assertThat(deposit.getStatus()).isEqualTo(VnPayDepositStatus.SUCCESS);
        assertThat(deposit.getVnpTransactionNo()).isEqualTo("123456");
        verify(depositRepository).saveAndFlush(deposit);
        verify(walletService).depositFunds(
                eq(USER_ID),
                eq(FinanceOperationKeys.vnpayDeposit(txnRef)),
                eq(BigDecimal.valueOf(100000)),
                eq(9L),
                eq(WalletReferenceType.VNPAY_DEPOSIT)
        );
    }

    @Test
    @DisplayName("should not double deposit on processReturn when deposit is already successful")
    void processReturn_localConfirmationEnabled_alreadySuccessDoesNotDepositAgain() {
        lenient().when(properties.isConfirmOnReturnEnabled()).thenReturn(true);
        String txnRef = "DEP20260526000010";
        VnPayDeposit deposit = pendingDeposit(10L, txnRef);
        deposit.setStatus(VnPayDepositStatus.SUCCESS);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=SUCCESS");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should not confirm on processReturn when return URL is not local")
    void processReturn_localConfirmationEnabled_publicReturnUrlDoesNotDepositFunds() {
        lenient().when(properties.isConfirmOnReturnEnabled()).thenReturn(true);
        lenient().when(properties.getReturnUrl()).thenReturn("https://api.woodcert.example/api/v1/wallets/vnpay/return");
        String txnRef = "DEP20260526000012";
        VnPayDeposit deposit = pendingDeposit(12L, txnRef);
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=PENDING");
        verify(depositRepository, never()).findByTxnRefForUpdate(txnRef);
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should mark failed on processReturn when local confirmation is enabled and VNPay failed")
    void processReturn_localConfirmationEnabled_failedMarksDepositFailed() {
        lenient().when(properties.isConfirmOnReturnEnabled()).thenReturn(true);
        String txnRef = "DEP20260526000011";
        VnPayDeposit deposit = pendingDeposit(11L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));
        when(depositRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = failedParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        String redirectUrl = vnPayService.processReturn(params);

        assertThat(redirectUrl).isEqualTo(FE_RETURN_URL + "?txnRef=" + txnRef + "&status=FAILED");
        assertThat(deposit.getStatus()).isEqualTo(VnPayDepositStatus.FAILED);
        assertThat(deposit.getVnpResponseCode()).isEqualTo("24");
        verify(depositRepository).saveAndFlush(deposit);
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("should confirm success on processIpn if not already processed")
    void processIpn_success() {
        String txnRef = "DEP20260526000003";
        VnPayDeposit deposit = pendingDeposit(3L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("00");
        assertThat(ipnResponse.get("Message")).isEqualTo("Confirm Success");
        assertThat(deposit.getStatus()).isEqualTo(VnPayDepositStatus.SUCCESS);
        assertThat(deposit.getVnpTransactionNo()).isEqualTo("123456");
        assertThat(deposit.getVnpBankCode()).isEqualTo("NCB");

        verify(depositRepository).findByTxnRefForUpdate(txnRef);
        verify(walletService).depositFunds(
                eq(USER_ID),
                eq(FinanceOperationKeys.vnpayDeposit(txnRef)),
                eq(BigDecimal.valueOf(100000)),
                eq(3L),
                eq(WalletReferenceType.VNPAY_DEPOSIT)
        );
    }

    @Test
    @DisplayName("should skip double deposit on processIpn if already SUCCESS")
    void processIpn_alreadySuccess_returnsRspCode02() {
        String txnRef = "DEP20260526000004";
        VnPayDeposit deposit = pendingDeposit(4L, txnRef);
        deposit.setStatus(VnPayDepositStatus.SUCCESS);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("02");
        assertThat(ipnResponse.get("Message")).isEqualTo("Order already confirmed");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("should skip double processing on processIpn if already FAILED")
    void processIpn_alreadyFailed_returnsRspCode02() {
        String txnRef = "DEP20260526000005";
        VnPayDeposit deposit = pendingDeposit(5L, txnRef);
        deposit.setStatus(VnPayDepositStatus.FAILED);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = failedParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("02");
        assertThat(ipnResponse.get("Message")).isEqualTo("Order already confirmed");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("should reject processIpn when amount mismatches deposit")
    void processIpn_amountMismatch_returnsRspCode04() {
        String txnRef = "DEP20260526000006";
        VnPayDeposit deposit = pendingDeposit(6L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(99999));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("04");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should reject processIpn when TmnCode mismatches merchant config")
    void processIpn_tmnCodeMismatch_returnsRspCode99() {
        String txnRef = "DEP20260526000007";
        VnPayDeposit deposit = pendingDeposit(7L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_TmnCode", "OTHER");
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("99");
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(depositRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should roll back transaction template when wallet deposit fails")
    void processIpn_walletDepositFails_returnsRspCode99AndRollsBack() {
        String txnRef = "DEP20260526000008";
        VnPayDeposit deposit = pendingDeposit(8L, txnRef);
        when(depositRepository.findByTxnRefForUpdate(txnRef)).thenReturn(Optional.of(deposit));
        org.mockito.Mockito.doThrow(new RuntimeException("wallet error"))
                .when(walletService)
                .depositFunds(any(), any(), any(), any(), any());

        Map<String, String> params = successfulParams(txnRef, BigDecimal.valueOf(100000));
        params.put("vnp_SecureHash", calculateTestChecksum(params));

        Map<String, String> ipnResponse = vnPayService.processIpn(params);

        assertThat(ipnResponse.get("RspCode")).isEqualTo("99");
        verify(transactionManager).rollback(any());
    }

    private VnPayDeposit pendingDeposit(Long id, String txnRef) {
        VnPayDeposit deposit = new VnPayDeposit();
        deposit.setId(id);
        deposit.setUserId(USER_ID);
        deposit.setAmount(BigDecimal.valueOf(100000));
        deposit.setStatus(VnPayDepositStatus.PENDING);
        deposit.setTxnRef(txnRef);
        return deposit;
    }

    private Map<String, String> successfulParams(String txnRef, BigDecimal amount) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TmnCode", TMN_CODE);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100)).toPlainString());
        params.put("vnp_OrderInfo", "Nap tien vi WoodCert " + txnRef);
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "123456");
        params.put("vnp_BankCode", "NCB");
        return params;
    }

    private Map<String, String> failedParams(String txnRef, BigDecimal amount) {
        Map<String, String> params = successfulParams(txnRef, amount);
        params.put("vnp_ResponseCode", "24");
        params.put("vnp_TransactionStatus", "02");
        params.put("vnp_TransactionNo", "0");
        return params;
    }

    private String calculateTestChecksum(Map<String, String> fields) {
        java.util.List<String> fieldNames = new java.util.ArrayList<>(fields.keySet());
        java.util.Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        java.util.Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                sb.append(fieldName);
                sb.append("=");
                sb.append(java.net.URLEncoder.encode(fieldValue, java.nio.charset.StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    sb.append("&");
                }
            }
        }
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA512");
            byte[] keyBytes = HASH_SECRET.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(keyBytes, "HmacSHA512");
            mac.init(secretKey);
            byte[] dataBytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            byte[] result = mac.doFinal(dataBytes);
            StringBuilder hexString = new StringBuilder(2 * result.length);
            for (byte b : result) {
                hexString.append(String.format("%02x", b & 0xff));
            }
            return hexString.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    private Map<String, String> queryParams(String paymentUrl) {
        String rawQuery = java.net.URI.create(paymentUrl).getRawQuery();
        Map<String, String> params = new HashMap<>();
        for (String pair : rawQuery.split("&")) {
            int separator = pair.indexOf('=');
            String key = separator >= 0 ? pair.substring(0, separator) : pair;
            String value = separator >= 0 ? pair.substring(separator + 1) : "";
            params.put(
                    java.net.URLDecoder.decode(key, java.nio.charset.StandardCharsets.US_ASCII),
                    java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.US_ASCII)
            );
        }
        return params;
    }
}
