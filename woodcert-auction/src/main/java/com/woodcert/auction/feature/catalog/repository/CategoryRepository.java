package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findAllByOrderByNameAsc();

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Integer id);

    boolean existsByParentId(Integer parentId);
}
