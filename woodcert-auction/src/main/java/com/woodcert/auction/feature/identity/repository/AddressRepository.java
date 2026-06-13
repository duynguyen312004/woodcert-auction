package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUser_IdOrderByIsDefaultDescIdAsc(String userId);

    Optional<Address> findByIdAndUser_Id(Long id, String userId);

    Optional<Address> findFirstByUser_IdAndIdNotOrderByIdAsc(String userId, Long id);

    boolean existsByUser_Id(String userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId AND a.isDefault = true")
    void clearDefaultByUserId(@Param("userId") String userId);
}
