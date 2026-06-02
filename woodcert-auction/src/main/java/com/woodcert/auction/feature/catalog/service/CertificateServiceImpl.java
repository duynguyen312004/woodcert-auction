package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.response.CertificateVerificationRes;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CertificateServiceImpl implements CertificateService {

    private final AppraisalReportRepository appraisalReportRepository;

    @Override
    @Transactional(readOnly = true)
    public CertificateVerificationRes verifyCertificate(String certificateCode) {
        String normalized = certificateCode == null ? "" : certificateCode.trim();
        if (normalized.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Certificate code is required");
        }
        return appraisalReportRepository.findByCertificateCodeWithProduct(normalized)
                .map(CertificateVerificationRes::fromEntity)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found"));
    }
}
