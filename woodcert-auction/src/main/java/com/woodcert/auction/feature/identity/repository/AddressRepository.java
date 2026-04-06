package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUser_IdOrderByIsDefaultDescIdAsc(String userId);

    boolean existsByUser_Id(String userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId AND a.isDefault = true")
    void clearDefaultByUserId(@Param("userId") String userId);
}
