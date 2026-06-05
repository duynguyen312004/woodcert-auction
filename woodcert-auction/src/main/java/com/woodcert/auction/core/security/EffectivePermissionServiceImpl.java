package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EffectivePermissionServiceImpl implements EffectivePermissionService {

    private final EffectivePermissionQueryRepository effectivePermissionQueryRepository;
    private final UserCapabilityStatusRepository capabilityStatusRepository;
    private final CapabilityPermissionMapper capabilityPermissionMapper;

    @Override
    @Transactional(readOnly = true)
    public Set<String> getEffectivePermissions(String userId) {
        Set<String> permissions = new HashSet<>(
                effectivePermissionQueryRepository.findAllPermissionNamesByUserId(userId));

        for (UserCapability capability : capabilityStatusRepository.findCapabilitiesByUserIdAndStatus(
                userId, CapabilityStatus.BANNED)) {
            permissions.removeAll(capabilityPermissionMapper.getPermissionsForCapability(capability));
        }

        return permissions;
    }
}
