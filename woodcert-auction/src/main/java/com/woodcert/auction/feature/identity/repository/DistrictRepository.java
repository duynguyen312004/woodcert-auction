package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistrictRepository extends JpaRepository<District, String> {

    List<District> findByProvinceCodeOrderByNameAsc(String provinceCode);

    boolean existsByCodeAndProvinceCode(String code, String provinceCode);
}
