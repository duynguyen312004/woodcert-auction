package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class SellerSummaryQueryServiceImpl implements SellerSummaryQueryService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, SellerSummary> findSellerSummaries(Collection<String> sellerIds) {
        List<String> ids = normalizeIds(sellerIds);
        if (ids.isEmpty()) {
            return Map.of();
        }

        Map<String, User> users = StreamSupport.stream(userRepository.findAllById(ids).spliterator(), false)
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left,
                        LinkedHashMap::new));
        Map<String, SellerProfile> profiles = StreamSupport
                .stream(sellerProfileRepository.findAllById(ids).spliterator(), false)
                .collect(Collectors.toMap(SellerProfile::getUserId, Function.identity(), (left, right) -> left,
                        LinkedHashMap::new));

        Map<String, SellerSummary> result = new LinkedHashMap<>();
        for (String id : ids) {
            User user = users.get(id);
            SellerProfile profile = profiles.get(id);
            if (user == null && profile == null) {
                continue;
            }

            String displayName = profile != null ? profile.getStoreName() : user.getFullName();
            result.put(id, new SellerSummary(
                    displayName,
                    profile != null ? profile.getReputationScore() : null));
        }
        return result;
    }

    private List<String> normalizeIds(Collection<String> sellerIds) {
        if (sellerIds == null || sellerIds.isEmpty()) {
            return List.of();
        }
        return sellerIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> !id.isBlank())
                .distinct()
                .toList();
    }
}
