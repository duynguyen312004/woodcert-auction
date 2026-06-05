package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface EffectivePermissionQueryRepository extends Repository<User, String> {

    @Query("""
            SELECT DISTINCT permission.name
            FROM User user
            JOIN user.roles role
            JOIN role.permissions permission
            WHERE user.id = :userId
            """)
    Set<String> findAllPermissionNamesByUserId(@Param("userId") String userId);
}
