package com.woodcert.auction.core.security;

import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ActiveUserJwtValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INACTIVE_USER_ERROR = new OAuth2Error(
            "invalid_token",
            "User account is not active",
            null);

    private final UserRepository userRepository;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        String userId = token.getSubject();
        if (userId == null || userId.isBlank()) {
            return OAuth2TokenValidatorResult.failure(INACTIVE_USER_ERROR);
        }

        return userRepository.findById(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .map(user -> OAuth2TokenValidatorResult.success())
                .orElseGet(() -> OAuth2TokenValidatorResult.failure(INACTIVE_USER_ERROR));
    }
}
