package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findAllByOrderByNameAsc();

    boolean existsBySlug(String slug);
}
