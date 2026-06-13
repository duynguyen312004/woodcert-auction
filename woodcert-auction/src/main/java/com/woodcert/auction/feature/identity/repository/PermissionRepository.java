package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {
}
