package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.CreateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;
import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryRes> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(CategoryRes::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public CategoryRes createCategory(CreateCategoryReq request) {
        String name = normalizeName(request.name());
        String slug = normalizeSlug(request.slug(), name);
        if (categoryRepository.existsByNameIgnoreCase(name) || categoryRepository.existsBySlug(slug)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Category name or slug already exists");
        }
        validateParent(request.parentId(), null);

        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setParentId(request.parentId());
        category.setDescription(trimToNull(request.description()));
        return CategoryRes.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryRes updateCategory(Integer id, UpdateCategoryReq request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        String name = normalizeName(request.name());
        String slug = normalizeSlug(request.slug(), name);
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)
                || categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Category name or slug already exists");
        }
        validateParent(request.parentId(), id);

        category.setName(name);
        category.setSlug(slug);
        category.setParentId(request.parentId());
        category.setDescription(trimToNull(request.description()));
        return CategoryRes.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        if (categoryRepository.existsByParentId(id) || productRepository.existsByCategoryId(id)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Category is still in use");
        }
        categoryRepository.delete(category);
    }

    private void validateParent(Integer parentId, Integer currentId) {
        if (parentId == null) {
            return;
        }
        if (parentId.equals(currentId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Category cannot be its own parent");
        }
        if (!categoryRepository.existsById(parentId)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND, "Parent category not found");
        }
    }

    private String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Category name is required");
        }
        return normalized;
    }

    private String normalizeSlug(String slug, String fallbackName) {
        String raw = slug == null || slug.isBlank() ? fallbackName : slug;
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Category slug is required");
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
