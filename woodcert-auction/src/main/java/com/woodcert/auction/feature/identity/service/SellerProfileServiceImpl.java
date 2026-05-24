package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.request.CreateSellerProfileReq;
import com.woodcert.auction.feature.identity.dto.response.SellerProfileRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SellerProfileServiceImpl implements SellerProfileService {

    private static final String SELLER_ROLE = "ROLE_SELLER";

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public SellerProfileRes getCurrentSellerProfile(String userId) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Seller profile not found"));
        return SellerProfileRes.fromEntity(sellerProfile);
    }

    @Override
    @Transactional
    public SellerProfileRes createSellerProfile(String userId, CreateSellerProfileReq request) {
        // Bước 1: Đọc user đang đăng ký hồ sơ seller.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        // Bước 2: Chặn tạo trùng seller profile cho cùng user.
        if (sellerProfileRepository.existsById(userId)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "User already has a seller profile");
        }

        // Bước 3: Chuẩn hóa và kiểm tra số CCCD/CMND không bị trùng.
        String identityCardNumber = request.identityCardNumber().trim();
        if (sellerProfileRepository.existsByIdentityCardNumber(identityCardNumber)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Identity card number already exists");
        }

        // Bước 4: Yêu cầu user đã có số điện thoại trước khi nâng cấp thành seller.
        if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Phone number is required before creating seller profile");
        }

        // Bước 5: Tạo seller profile với điểm uy tín mặc định.
        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setUser(user);
        sellerProfile.setStoreName(request.storeName().trim());
        sellerProfile.setIdentityCardNumber(identityCardNumber);
        sellerProfile.setTaxCode(IdentityNormalizationUtils.normalizeNullable(request.taxCode()));
        sellerProfile.setReputationScore(new BigDecimal("5.00"));

        // Bước 6: Gắn ROLE_SELLER cho user trong cùng transaction rồi lưu profile.
        assignSellerRole(user);

        return SellerProfileRes.fromEntity(sellerProfileRepository.save(sellerProfile));
    }

    private void assignSellerRole(User user) {
        // Bước 1: Nếu user đã có role seller thì không cần thêm lại.
        boolean alreadySeller = user.getRoles().stream()
                .map(Role::getName)
                .anyMatch(SELLER_ROLE::equals);

        if (alreadySeller) {
            return;
        }

        // Bước 2: Lấy ROLE_SELLER từ DB và thêm vào tập role hiện tại của user.
        Role sellerRole = roleRepository.findByName(SELLER_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Role ROLE_SELLER not found"));

        user.getRoles().add(sellerRole);
    }
}
