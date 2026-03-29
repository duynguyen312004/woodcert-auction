package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserId(String userId);
}
