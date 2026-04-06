package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.request.CreateSellerProfileReq;
import com.woodcert.auction.feature.identity.dto.response.SellerProfileRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerProfileServiceImplTest {

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private SellerProfileServiceImpl sellerProfileService;

    @Test
    @DisplayName("getCurrentSellerProfile throws when seller profile does not exist")
    void getCurrentSellerProfile_notFound_throwsAppException() {
        when(sellerProfileRepository.findById("user-1")).thenReturn(Optional.empty());

        AppException exception = assertThrows(
                AppException.class,
                () -> sellerProfileService.getCurrentSellerProfile("user-1")
        );

        assertEquals("Seller profile not found", exception.getMessage());
    }

    @Test
    @DisplayName("createSellerProfile saves seller profile and assigns seller role")
    void createSellerProfile_success_createsProfile() {
        User user = createUser();
        Role sellerRole = new Role();
        sellerRole.setId(2);
        sellerRole.setName("ROLE_SELLER");
        CreateSellerProfileReq request = new CreateSellerProfileReq("Xuong go ABC", "001099012345", "0101234567");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);
        when(sellerProfileRepository.existsByIdentityCardNumber("001099012345")).thenReturn(false);
        when(roleRepository.findByName("ROLE_SELLER")).thenReturn(Optional.of(sellerRole));
        when(sellerProfileRepository.save(any(SellerProfile.class))).thenAnswer(invocation -> {
            SellerProfile sellerProfile = invocation.getArgument(0);
            sellerProfile.setUserId(user.getId());
            return sellerProfile;
        });

        SellerProfileRes result = sellerProfileService.createSellerProfile("user-1", request);

        assertEquals("user-1", result.userId());
        assertEquals("Xuong go ABC", result.storeName());
        assertTrue(user.getRoles().stream().anyMatch(role -> "ROLE_SELLER".equals(role.getName())));
    }

    @Test
    @DisplayName("createSellerProfile throws when identity card number already exists")
    void createSellerProfile_duplicateIdentityCard_throwsAppException() {
        User user = createUser();
        CreateSellerProfileReq request = new CreateSellerProfileReq("Xuong go ABC", "001099012345", null);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);
        when(sellerProfileRepository.existsByIdentityCardNumber("001099012345")).thenReturn(true);

        AppException exception = assertThrows(
                AppException.class,
                () -> sellerProfileService.createSellerProfile("user-1", request)
        );

        assertEquals("Identity card number already exists", exception.getMessage());
    }

    private User createUser() {
        Role bidderRole = new Role();
        bidderRole.setId(1);
        bidderRole.setName("ROLE_BIDDER");

        User user = new User();
        user.setId("user-1");
        user.setEmail("seller@example.com");
        user.setFullName("Seller User");
        user.setPhoneNumber("0911222333");
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(new HashSet<>(java.util.Set.of(bidderRole)));
        return user;
    }
}
