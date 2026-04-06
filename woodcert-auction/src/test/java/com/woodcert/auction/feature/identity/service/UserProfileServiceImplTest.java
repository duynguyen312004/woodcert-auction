package com.woodcert.auction.feature.identity.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.request.PatchUserProfileReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateUserProfileReq;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    @Test
    @DisplayName("getCurrentUserProfile returns mapped profile with roles and seller flag")
    void getCurrentUserProfile_userExists_returnsProfile() {
        User user = createUser("user-1", "0911222333");

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(sellerProfileRepository.existsById("user-1")).thenReturn(true);

        UserProfileRes result = userProfileService.getCurrentUserProfile("user-1");

        assertEquals("user-1", result.id());
        assertEquals("user@example.com", result.email());
        assertEquals(2, result.roles().size());
        assertTrue(result.hasSellerProfile());
    }

    @Test
    @DisplayName("updateCurrentUserProfile throws when phone number belongs to another user")
    void updateCurrentUserProfile_duplicatePhone_throwsAppException() {
        User user = createUser("user-1", "0911222333");
        UpdateUserProfileReq request = new UpdateUserProfileReq("Updated User", "0999888777", null);

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.existsByPhoneNumberAndIdNot("0999888777", "user-1")).thenReturn(true);

        AppException exception = assertThrows(
                AppException.class,
                () -> userProfileService.updateCurrentUserProfile("user-1", request)
        );

        assertEquals("Phone number already exists", exception.getMessage());
    }

    @Test
    @DisplayName("updateCurrentUserProfile updates current user and trims blank optional fields")
    void updateCurrentUserProfile_success_updatesUser() {
        User user = createUser("user-1", "0911222333");
        UpdateUserProfileReq request = new UpdateUserProfileReq("  Updated User  ", null, "  https://img  ");

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);

        UserProfileRes result = userProfileService.updateCurrentUserProfile("user-1", request);

        assertEquals("Updated User", user.getFullName());
        assertEquals("0911222333", user.getPhoneNumber());
        assertEquals("https://img", user.getAvatarUrl());
        assertFalse(result.hasSellerProfile());
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("updateCurrentUserProfile clears phone number when blank is provided")
    void updateCurrentUserProfile_blankPhone_clearsField() {
        User user = createUser("user-1", "0911222333");
        UpdateUserProfileReq request = new UpdateUserProfileReq(null, "   ", null);

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);

        userProfileService.updateCurrentUserProfile("user-1", request);

        assertNull(user.getPhoneNumber());
    }

    @Test
    @DisplayName("updateCurrentUserProfile normalizes +84 phone before duplicate check")
    void updateCurrentUserProfile_normalizesPhoneBeforeConflictCheck() {
        User user = createUser("user-1", "0911222333");
        UpdateUserProfileReq request = new UpdateUserProfileReq(null, "+84999888777", null);

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.existsByPhoneNumberAndIdNot("0999888777", "user-1")).thenReturn(true);

        AppException exception = assertThrows(
                AppException.class,
                () -> userProfileService.updateCurrentUserProfile("user-1", request)
        );

        assertEquals("Phone number already exists", exception.getMessage());
    }

    @Test
    @DisplayName("patchCurrentUserProfile keeps omitted fields and clears avatar when null is provided")
    void patchCurrentUserProfile_nullClearsAndMissingKeeps() {
        User user = createUser("user-1", "0911222333");
        user.setAvatarUrl("https://old-avatar");
        PatchUserProfileReq request = new PatchUserProfileReq(
                JsonNodeFactory.instance.textNode("Patched User"),
                null,
                JsonNodeFactory.instance.nullNode()
        );

        when(userRepository.findById("user-1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);

        UserProfileRes result = userProfileService.patchCurrentUserProfile("user-1", request);

        assertEquals("Patched User", user.getFullName());
        assertEquals("0911222333", user.getPhoneNumber());
        assertNull(user.getAvatarUrl());
        assertFalse(result.hasSellerProfile());
    }

    @Test
    @DisplayName("patchCurrentUserProfile throws when no field is provided")
    void patchCurrentUserProfile_noField_throws() {
        PatchUserProfileReq request = new PatchUserProfileReq(null, null, null);

        AppException exception = assertThrows(
                AppException.class,
                () -> userProfileService.patchCurrentUserProfile("user-1", request)
        );

        assertEquals("At least one field must be provided", exception.getMessage());
    }

    private User createUser(String userId, String phoneNumber) {
        Role bidderRole = new Role();
        bidderRole.setId(1);
        bidderRole.setName("ROLE_BIDDER");

        Role sellerRole = new Role();
        sellerRole.setId(2);
        sellerRole.setName("ROLE_SELLER");

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setFullName("Original User");
        user.setPhoneNumber(phoneNumber);
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(bidderRole, sellerRole));
        return user;
    }
}
