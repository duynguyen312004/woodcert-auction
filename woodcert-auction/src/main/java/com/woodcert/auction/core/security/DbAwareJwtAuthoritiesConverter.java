package com.woodcert.auction.core.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DbAwareJwtAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final EffectivePermissionService effectivePermissionService;

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        String userId = jwt.getSubject();
        if (userId == null || userId.isBlank()) {
            return Set.of();
        }
        return effectivePermissionService.getEffectivePermissions(userId).stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }
}
