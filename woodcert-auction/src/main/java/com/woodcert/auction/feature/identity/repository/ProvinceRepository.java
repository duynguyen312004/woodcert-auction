package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.Province;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProvinceRepository extends JpaRepository<Province, String> {

    List<Province> findAllByOrderByNameAsc();
}
