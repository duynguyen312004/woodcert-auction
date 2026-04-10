package com.woodcert.auction.feature.media.util;

import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CloudinarySignatureService {

    private final CloudinaryProperties properties;

    public String sign(Map<String, String> params) {
        String joinedParams = params.entrySet().stream()
                .filter(entry -> hasText(entry.getValue()))
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .map(entry -> entry.getKey() + "=" + entry.getValue().trim())
                .collect(Collectors.joining("&"));

        return sha1Hex(joinedParams + properties.getApiSecret());
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String sha1Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte current : bytes) {
                hex.append(String.format("%02x", current));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-1 algorithm is not available", ex);
        }
    }
}
