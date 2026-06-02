package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.response.CertificateVerificationRes;

public interface CertificateService {

    CertificateVerificationRes verifyCertificate(String certificateCode);
}
