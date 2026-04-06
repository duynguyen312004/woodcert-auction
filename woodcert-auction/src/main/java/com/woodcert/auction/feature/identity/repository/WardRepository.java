package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WardRepository extends JpaRepository<Ward, String> {

    List<Ward> findByDistrictCodeOrderByNameAsc(String districtCode);

    boolean existsByCodeAndDistrictCode(String code, String districtCode);
}
