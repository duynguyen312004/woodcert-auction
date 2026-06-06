package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EffectivePermissionServiceImplTest {

    @Mock private EffectivePermissionQueryRepository effectivePermissionQueryRepository;
    @Mock private UserCapabilityStatusRepository capabilityStatusRepository;
    @Mock private CapabilityPermissionMapper capabilityPermissionMapper;

    @InjectMocks private EffectivePermissionServiceImpl service;

    @Test
    void buyerBanned_losesRegisterAndBidPermissionsOnly() {
        when(effectivePermissionQueryRepository.findAllPermissionNamesByUserId("user-1"))
                .thenReturn(Set.of("REGISTER_AUCTION", "CREATE_BID", "JOIN_AUCTION"));
        when(capabilityStatusRepository.findCapabilitiesByUserIdAndStatus("user-1", CapabilityStatus.BANNED))
                .thenReturn(List.of(UserCapability.BUYER));
        when(capabilityPermissionMapper.getPermissionsForCapability(UserCapability.BUYER))
                .thenReturn(Set.of("REGISTER_AUCTION", "CREATE_BID"));

        Set<String> permissions = service.getEffectivePermissions("user-1");

        assertThat(permissions).containsExactly("JOIN_AUCTION");
    }

    @Test
    void sellerBanned_losesSellerPermissions() {
        when(effectivePermissionQueryRepository.findAllPermissionNamesByUserId("user-1"))
                .thenReturn(Set.of(
                        "CREATE_PRODUCT",
                        "SUBMIT_APPRAISAL_REQUEST",
                        "CREATE_AUCTION_SESSION",
                        "CONFIRM_DELIVERY",
                        "CREATE_BID"));
        when(capabilityStatusRepository.findCapabilitiesByUserIdAndStatus("user-1", CapabilityStatus.BANNED))
                .thenReturn(List.of(UserCapability.SELLER));
        when(capabilityPermissionMapper.getPermissionsForCapability(UserCapability.SELLER))
                .thenReturn(Set.of(
                        "CREATE_PRODUCT",
                        "SUBMIT_APPRAISAL_REQUEST",
                        "CREATE_AUCTION_SESSION"));

        Set<String> permissions = service.getEffectivePermissions("user-1");

        assertThat(permissions).containsExactlyInAnyOrder("CONFIRM_DELIVERY", "CREATE_BID");
    }

    @Test
    void appraiserBanned_losesApproveProduct() {
        when(effectivePermissionQueryRepository.findAllPermissionNamesByUserId("user-1"))
                .thenReturn(Set.of("APPROVE_PRODUCT", "CREATE_BID"));
        when(capabilityStatusRepository.findCapabilitiesByUserIdAndStatus("user-1", CapabilityStatus.BANNED))
                .thenReturn(List.of(UserCapability.APPRAISER));
        when(capabilityPermissionMapper.getPermissionsForCapability(UserCapability.APPRAISER))
                .thenReturn(Set.of("APPROVE_PRODUCT"));

        Set<String> permissions = service.getEffectivePermissions("user-1");

        assertThat(permissions).containsExactly("CREATE_BID");
    }
}
