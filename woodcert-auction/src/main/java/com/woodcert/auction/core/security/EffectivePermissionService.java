package com.woodcert.auction.core.security;

import java.util.Set;

public interface EffectivePermissionService {

    Set<String> getEffectivePermissions(String userId);
}
