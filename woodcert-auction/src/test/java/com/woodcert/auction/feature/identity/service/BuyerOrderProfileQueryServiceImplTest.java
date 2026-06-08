package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuyerOrderProfileQueryServiceImplTest {

    @Mock private UserRepository userRepository;

    @Test
    void findBuyerProfile_whenBuyerIdMatchesUserIdReturnsContactSummary() {
        User user = user("buyer-1", "buyer@example.com");
        BuyerOrderProfileQueryServiceImpl service = new BuyerOrderProfileQueryServiceImpl(userRepository);
        when(userRepository.findById("buyer-1")).thenReturn(Optional.of(user));

        var result = service.findBuyerProfile("buyer-1");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("buyer-1");
        assertThat(result.get().fullName()).isEqualTo("Nguyen Van A");
        assertThat(result.get().phoneNumber()).isEqualTo("0911222333");
        assertThat(result.get().email()).isEqualTo("buyer@example.com");
    }

    @Test
    void findBuyerProfile_whenBuyerIdIsLegacyEmailFallsBackToEmailLookup() {
        User user = user("buyer-1", "buyer@example.com");
        BuyerOrderProfileQueryServiceImpl service = new BuyerOrderProfileQueryServiceImpl(userRepository);
        when(userRepository.findById("buyer@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));

        var result = service.findBuyerProfile("buyer@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("buyer-1");
        verify(userRepository).findByEmail("buyer@example.com");
    }

    private User user(String id, String email) {
        User user = new User();
        user.setId(id);
        user.setFullName("Nguyen Van A");
        user.setPhoneNumber("0911222333");
        user.setEmail(email);
        return user;
    }
}
