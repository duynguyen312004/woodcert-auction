package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActiveUserJwtValidatorTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void validate_activeUser_succeeds() {
        User user = user("user-1", UserStatus.ACTIVE);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        var validator = new ActiveUserJwtValidator(userRepository);
        var result = validator.validate(jwt("user-1"));

        assertThat(result.hasErrors()).isFalse();
    }

    @Test
    void validate_bannedUser_fails() {
        User user = user("user-1", UserStatus.BANNED);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        var validator = new ActiveUserJwtValidator(userRepository);
        var result = validator.validate(jwt("user-1"));

        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void validate_missingUser_fails() {
        when(userRepository.findById("missing-user")).thenReturn(Optional.empty());

        var validator = new ActiveUserJwtValidator(userRepository);
        var result = validator.validate(jwt("missing-user"));

        assertThat(result.hasErrors()).isTrue();
    }

    private static User user(String id, UserStatus status) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFullName("User " + id);
        user.setStatus(status);
        return user;
    }

    private static Jwt jwt(String subject) {
        return Jwt.withTokenValue("token")
                .header("alg", "HS512")
                .subject(subject)
                .build();
    }
}
