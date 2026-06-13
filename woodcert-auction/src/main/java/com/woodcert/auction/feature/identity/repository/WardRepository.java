package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, String> {

    List<Ward> findByDistrictCodeOrderByNameAsc(String districtCode);

    boolean existsByCodeAndDistrictCode(String code, String districtCode);
}
