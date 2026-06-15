package com.woodcert.auction.feature.dispute.controller;

import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeMessageReq;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

class DisputeControllerSecurityTest {

    @Test
    void adminDetailAndMessageEndpointsRequireResolveDisputePermission() throws Exception {
        PreAuthorize detailAuthorization = DisputeController.class
                .getMethod("getAdminDispute", Long.class)
                .getAnnotation(PreAuthorize.class);
        PreAuthorize messageAuthorization = DisputeController.class
                .getMethod("addAdminMessage", String.class, Long.class, CreateDisputeMessageReq.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(detailAuthorization.value()).isEqualTo("hasAuthority('RESOLVE_DISPUTE')");
        assertThat(messageAuthorization.value()).isEqualTo("hasAuthority('RESOLVE_DISPUTE')");
    }
}
