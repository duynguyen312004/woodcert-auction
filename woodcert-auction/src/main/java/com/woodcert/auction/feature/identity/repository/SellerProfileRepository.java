package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, String> {

    boolean existsByIdentityCardNumber(String identityCardNumber);
}
