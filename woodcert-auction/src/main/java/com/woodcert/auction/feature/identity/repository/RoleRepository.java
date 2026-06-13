package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);
}
