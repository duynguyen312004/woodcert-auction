package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.core.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("register normalizes +84 phone before duplicate check and save")
    void register_normalizesVietnamesePhone() {
        RegisterReq request = new RegisterReq(
                "user@example.com",
                "Password123",
                "Nguyen Van A",
                "+84987654321"
        );

        Role bidderRole = new Role();
        bidderRole.setId(1);
        bidderRole.setName("ROLE_BIDDER");

        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("0987654321")).thenReturn(false);
        when(roleRepository.findByName("ROLE_BIDDER")).thenReturn(Optional.of(bidderRole));
        when(passwordEncoder.encode("Password123")).thenReturn("hashed-password");
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            return user;
        });

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("0987654321", userCaptor.getValue().getPhoneNumber());
    }
}
