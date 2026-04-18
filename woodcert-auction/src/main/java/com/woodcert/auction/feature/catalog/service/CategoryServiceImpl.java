package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryRes> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(CategoryRes::fromEntity)
                .toList();
    }
}
