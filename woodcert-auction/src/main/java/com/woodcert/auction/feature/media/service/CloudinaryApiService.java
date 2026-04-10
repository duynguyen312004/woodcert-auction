package com.woodcert.auction.feature.media.service;

import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.support.CloudinaryResourceDetails;
import com.woodcert.auction.feature.media.util.CloudinarySignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CloudinaryApiService {

    private final CloudinaryProperties properties;
    private final CloudinarySignatureService signatureService;
    private final RestClient restClient;

    public String buildUploadUrl(String resourceType) {
        return apiBaseUrl() + "/" + resourceType + "/upload";
    }

    public Optional<CloudinaryResourceDetails> fetchUploadedResource(String assetId) {
        try {
            CloudinaryResourceDetails response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme(properties.isSecure() ? "https" : "http")
                            .host("api.cloudinary.com")
                            .path("/v1_1/{cloudName}/resources/{assetId}")
                            .build(properties.getCloudName(), assetId))
                    .headers(headers -> headers.setBasicAuth(properties.getApiKey(), properties.getApiSecret()))
                    .retrieve()
                    .body(CloudinaryResourceDetails.class);

            return Optional.ofNullable(response);
        } catch (HttpClientErrorException.NotFound ex) {
            return Optional.empty();
        }
    }

    public boolean destroy(MediaAsset asset) {
        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> paramsToSign = Map.of(
                "invalidate", "true",
                "public_id", asset.getPublicId(),
                "timestamp", String.valueOf(timestamp));

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("public_id", asset.getPublicId());
        formData.add("invalidate", "true");
        formData.add("timestamp", String.valueOf(timestamp));
        formData.add("api_key", properties.getApiKey());
        formData.add("signature", signatureService.sign(paramsToSign));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(apiBaseUrl() + "/" + asset.getResourceType().getCloudinaryValue() + "/destroy")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(Map.class);

        Object result = response == null ? null : response.get("result");
        return "ok".equalsIgnoreCase(String.valueOf(result))
                || "not found".equalsIgnoreCase(String.valueOf(result));
    }

    private String apiBaseUrl() {
        String protocol = properties.isSecure() ? "https" : "http";
        return protocol + "://api.cloudinary.com/v1_1/" + properties.getCloudName();
    }
}
