package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.EmailVerificationProperties;
import com.woodcert.auction.core.config.PasswordResetProperties;
import com.woodcert.auction.feature.identity.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class IdentityEmailServiceTest {

    @Mock
    private EmailVerificationProperties emailVerificationProperties;
    @Mock
    private PasswordResetProperties passwordResetProperties;
    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;
    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendPasswordResetEmail_withoutMailSenderDoesNotLogRawToken(CapturedOutput output) {
        when(passwordResetProperties.getResetLinkBaseUrl()).thenReturn("http://localhost:5173/auth/reset-password");
        when(mailSenderProvider.getIfAvailable()).thenReturn(null);

        IdentityEmailService service = new IdentityEmailService(
                emailVerificationProperties,
                passwordResetProperties,
                mailSenderProvider);

        service.sendPasswordResetEmail(user(), "raw-reset-token");

        assertThat(output).doesNotContain("raw-reset-token");
        assertThat(output).doesNotContain("token=raw-reset-token");
        assertThat(output).doesNotContain("user@example.com");
    }

    @Test
    void sendVerificationEmail_withoutMailSenderDoesNotLogRawToken(CapturedOutput output) {
        when(emailVerificationProperties.getVerificationLinkBaseUrl()).thenReturn("http://localhost:5173/auth/verify-email");
        when(mailSenderProvider.getIfAvailable()).thenReturn(null);

        IdentityEmailService service = new IdentityEmailService(
                emailVerificationProperties,
                passwordResetProperties,
                mailSenderProvider);

        service.sendVerificationEmail(user(), "raw-verification-token");

        assertThat(output).doesNotContain("raw-verification-token");
        assertThat(output).doesNotContain("token=raw-verification-token");
        assertThat(output).doesNotContain("user@example.com");
    }

    @Test
    void sendPasswordResetEmail_whenBaseUrlHasQueryAppendsTokenWithAmpersand() {
        when(passwordResetProperties.getResetLinkBaseUrl())
                .thenReturn("http://localhost:5173/auth/reset-password?source=email");
        when(passwordResetProperties.getSubject()).thenReturn("Reset password");
        when(passwordResetProperties.getTokenTtlSeconds()).thenReturn(900L);
        when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);

        IdentityEmailService service = new IdentityEmailService(
                emailVerificationProperties,
                passwordResetProperties,
                mailSenderProvider);

        service.sendPasswordResetEmail(user(), "raw-reset-token");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        assertThat(messageCaptor.getValue().getText())
                .contains("http://localhost:5173/auth/reset-password?source=email&token=raw-reset-token")
                .doesNotContain("?source=email?token=");
    }

    private User user() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setFullName("User One");
        return user;
    }
}
