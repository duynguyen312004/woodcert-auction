package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.entity.UserCapabilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserCapabilityStatusRepository extends JpaRepository<UserCapabilityStatus, Long> {

    List<UserCapabilityStatus> findByUserId(String userId);

    List<UserCapabilityStatus> findByUserIdIn(Collection<String> userIds);

    Optional<UserCapabilityStatus> findByUserIdAndCapability(String userId, UserCapability capability);

    @Query("""
            SELECT ucs.capability
            FROM UserCapabilityStatus ucs
            WHERE ucs.userId = :userId
              AND ucs.status = :status
            """)
    List<UserCapability> findCapabilitiesByUserIdAndStatus(
            @Param("userId") String userId,
            @Param("status") CapabilityStatus status);
}
