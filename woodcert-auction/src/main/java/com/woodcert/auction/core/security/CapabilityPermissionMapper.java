package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.UserCapability;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class CapabilityPermissionMapper {

    private static final Map<UserCapability, Set<String>> BLOCKED_PERMISSIONS = Map.of(
            UserCapability.BUYER, Set.of("REGISTER_AUCTION", "CREATE_BID"),
            UserCapability.SELLER, Set.of(
                    "CREATE_PRODUCT",
                    "SUBMIT_APPRAISAL_REQUEST",
                    "CREATE_AUCTION_SESSION"),
            UserCapability.APPRAISER, Set.of("APPROVE_PRODUCT"));

    public Set<String> getPermissionsForCapability(UserCapability capability) {
        return BLOCKED_PERMISSIONS.getOrDefault(capability, Set.of());
    }
}
