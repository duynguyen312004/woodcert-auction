package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.EmailVerificationProperties;
import com.woodcert.auction.core.config.PasswordResetProperties;
import com.woodcert.auction.feature.identity.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdentityEmailService {

    private final EmailVerificationProperties emailVerificationProperties;
    private final PasswordResetProperties passwordResetProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public void sendVerificationEmail(User user, String rawToken) {
        String verificationUrl = buildUrl(emailVerificationProperties.getVerificationLinkBaseUrl(), rawToken);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mail sender is not configured; verification email was not sent.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (hasText(emailVerificationProperties.getFromAddress())) {
                message.setFrom(emailVerificationProperties.getFromAddress());
            }
            message.setTo(user.getEmail());
            message.setSubject(emailVerificationProperties.getSubject());
            message.setText("""
                    Hello %s,

                    Please verify your email address by clicking the link below:
                    %s

                    This link expires in %d minutes.
                    """.formatted(
                    user.getFullName(),
                    verificationUrl,
                    Math.max(1, emailVerificationProperties.getTokenTtlSeconds() / 60)));
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn(
                    "Failed to send verification email. The account was created, but the message could not be delivered.",
                    ex);
        }
    }

    public void sendPasswordResetEmail(User user, String rawToken) {
        String resetUrl = buildUrl(passwordResetProperties.getResetLinkBaseUrl(), rawToken);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mail sender is not configured; password reset email was not sent.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (hasText(passwordResetProperties.getFromAddress())) {
                message.setFrom(passwordResetProperties.getFromAddress());
            }
            message.setTo(user.getEmail());
            message.setSubject(passwordResetProperties.getSubject());
            message.setText("""
                    Hello %s,

                    You requested to reset your password. Click the link below to proceed:
                    %s

                    This link expires in %d minutes. If you did not request this, you can safely ignore this email.
                    """.formatted(
                    user.getFullName(),
                    resetUrl,
                    Math.max(1, passwordResetProperties.getTokenTtlSeconds() / 60)));
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send password reset email.", ex);
        }
    }

    private String buildUrl(String baseUrl, String rawToken) {
        return UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("token", rawToken)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
