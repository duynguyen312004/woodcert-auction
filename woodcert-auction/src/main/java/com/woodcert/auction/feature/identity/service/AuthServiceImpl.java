package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.EmailVerificationProperties;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.core.security.JwtService;
import com.woodcert.auction.feature.identity.dto.request.LoginReq;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.dto.response.AuthRes;
import com.woodcert.auction.feature.identity.dto.response.RefreshRes;
import com.woodcert.auction.feature.identity.dto.response.RegisterRes;
import com.woodcert.auction.feature.identity.entity.EmailVerificationToken;
import com.woodcert.auction.feature.identity.entity.RefreshToken;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.EmailVerificationTokenRepository;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service xử lý xác thực.
 * Phụ trách đăng nhập, đăng ký, xác minh email, refresh token có rotation và logout.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationProperties emailVerificationProperties;
    private final IdentityTokenService identityTokenService;
    private final IdentityEmailService identityEmailService;
    private final PasswordResetService passwordResetService;
    private final LoginAttemptService loginAttemptService;

    @Override
    @Transactional
    public AuthRes login(LoginReq request) {
        // Bước 1: Chuẩn hóa email để authentication và truy vấn DB dùng cùng một định dạng.
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());

        // Kiểm tra xem tài khoản có bị khóa brute force không
        if (loginAttemptService.isBlocked(normalizedEmail)) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        // Bước 2: Xác thực mật khẩu qua Spring Security AuthenticationManager.
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        } catch (BadCredentialsException e) {
            loginAttemptService.loginFailed(normalizedEmail);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Đăng nhập thành công -> xóa số lần sai
        loginAttemptService.loginSucceeded(normalizedEmail);

        // Bước 3: Đọc user kèm role để sinh JWT và trả role cho client.
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        // Bước 4: Chặn tài khoản bị khóa hoặc chưa xác minh email.
        if (user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_BANNED);
        }
        if (user.getStatus() == UserStatus.UNVERIFIED) {
            throw new AppException(ErrorCode.ACCOUNT_UNVERIFIED);
        }

        // Bước 5: Sinh access token và refresh token thô cho phiên đăng nhập mới.
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();

        // Bước 6: Chỉ lưu hash của refresh token để hạn chế rủi ro nếu DB bị lộ.
        saveRefreshToken(user, rawRefreshToken);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return new AuthRes(accessToken, rawRefreshToken, roles);
    }

    @Override
    @Transactional
    public RegisterRes register(RegisterReq request) {
        // Bước 1: Chuẩn hóa email, họ tên và số điện thoại trước khi kiểm tra trùng.
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());
        String normalizedFullName = request.fullName().trim();
        String normalizedPhoneNumber = IdentityNormalizationUtils
                .normalizeVietnamesePhoneNullable(request.phoneNumber());

        // Bước 2: Chặn email hoặc số điện thoại đã tồn tại.
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Email already exists");
        }
        if (normalizedPhoneNumber != null && userRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        // Bước 3: Lấy role mặc định cho người dùng mới.
        Role bidderRole = roleRepository.findByName("ROLE_BIDDER")
                .orElseThrow(
                        () -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Default role ROLE_BIDDER not found"));

        // Bước 4: Tạo user ở trạng thái UNVERIFIED và gắn role bidder.
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(normalizedFullName);
        user.setPhoneNumber(normalizedPhoneNumber);
        user.setStatus(UserStatus.UNVERIFIED);
        user.setRoles(Set.of(bidderRole));

        user = userRepository.save(user);

        // Bước 5: Sinh token xác minh email, lưu hash và gửi email xác minh.
        issueAndSendVerificationToken(user);

        log.info("User {} registered successfully", user.getEmail());
        return RegisterRes.fromEntity(user);
    }

    @Override
    @Transactional
    public void verifyEmail(String rawToken) {
        // Bước 1: Kiểm tra token thô từ email có được gửi lên hay không.
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
        }

        // Bước 2: Hash token thô rồi tìm bản ghi token đang lưu trong DB.
        EmailVerificationToken verificationToken = emailVerificationTokenRepository
                .findByTokenHash(identityTokenService.hash(rawToken))
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

        // Bước 3: Chặn token đã dùng hoặc đã hết hạn.
        if (verificationToken.getVerifiedAt() != null) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }
        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
        }

        // Bước 4: Nếu user đã ACTIVE thì đánh dấu token đã xử lý và trả lỗi đã xác minh.
        User user = verificationToken.getUser();
        if (user.getStatus() == UserStatus.ACTIVE) {
            verificationToken.setVerifiedAt(Instant.now());
            emailVerificationTokenRepository.save(verificationToken);
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // Bước 5: Kích hoạt user, đánh dấu token hiện tại đã dùng và xóa token xác minh cũ chưa dùng.
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        verificationToken.setVerifiedAt(Instant.now());
        emailVerificationTokenRepository.save(verificationToken);
        emailVerificationTokenRepository.deleteByUserAndVerifiedAtIsNull(user);

        log.info("Email verified successfully for user {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        // Bước 1: Chuẩn hóa email; email không hợp lệ được bỏ qua để tránh lộ thông tin tài khoản.
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(email);
        if (normalizedEmail == null) {
            return;
        }

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            // Bước 2: Chỉ gửi lại cho tài khoản vẫn đang UNVERIFIED.
            if (user.getStatus() != UserStatus.UNVERIFIED) {
                return;
            }

            // Bước 3: Kiểm tra cooldown để tránh spam email xác minh.
            emailVerificationTokenRepository.findTopByUserAndVerifiedAtIsNullOrderByCreatedAtDesc(user)
                    .ifPresent(latestToken -> {
                        Instant cooldownDeadline = latestToken.getCreatedAt()
                                .plusSeconds(emailVerificationProperties.getResendCooldownSeconds());
                        if (cooldownDeadline.isAfter(Instant.now())) {
                            throw new AppException(ErrorCode.EMAIL_VERIFICATION_RESEND_TOO_SOON);
                        }
                    });

            // Bước 4: Xóa token xác minh cũ chưa dùng rồi phát hành token mới.
            emailVerificationTokenRepository.deleteByUserAndVerifiedAtIsNull(user);
            issueAndSendVerificationToken(user);
            log.info("Verification email resent for user {}", user.getEmail());
        });
    }

    @Override
    @Transactional
    public RefreshRes refresh(String rawRefreshToken) {
        // Bước 1: Hash refresh token thô để tìm token đã lưu.
        String tokenHash = identityTokenService.hash(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByToken(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

        // Bước 2: Kiểm tra token chưa bị revoke và chưa hết hạn.
        if (storedToken.isRevoked()) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        // Bước 3: Revoke refresh token cũ để thực hiện token rotation.
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Bước 4: Sinh access token mới và refresh token mới cho cùng user.
        User user = storedToken.getUser();
        if (user.getStatus() == UserStatus.BANNED) {
            refreshTokenRepository.revokeAllByUser(user);
            throw new AppException(ErrorCode.ACCOUNT_BANNED);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            refreshTokenRepository.revokeAllByUser(user);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRawRefreshToken = jwtService.generateRefreshToken();

        // Bước 5: Lưu hash của refresh token mới và trả token thô cho client.
        saveRefreshToken(user, newRawRefreshToken);

        log.info("Token refreshed for user {}", user.getEmail());
        return new RefreshRes(newAccessToken, newRawRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        // Bước 1: Logout là idempotent; token rỗng thì không cần xử lý.
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        // Bước 2: Hash token và revoke nếu token đang tồn tại trong DB.
        String tokenHash = identityTokenService.hash(rawRefreshToken);
        refreshTokenRepository.findByToken(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("User {} logged out", token.getUser().getEmail());
        });
    }

    @Override
    public void requestPasswordReset(String email) {
        passwordResetService.requestPasswordReset(email);
    }

    @Override
    public void resetPassword(String rawToken, String newPassword) {
        passwordResetService.resetPassword(rawToken, newPassword);
    }

    // --- Helper nội bộ ---

    /**
     * Lưu refresh token dưới dạng hash vào DB.
     */
    private void saveRefreshToken(User user, String rawToken) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(identityTokenService.hash(rawToken));
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plusSeconds(jwtService.getRefreshTokenExpiration()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Tạo token xác minh email mới, lưu hash và gửi email chứa token thô.
     */
    private void issueAndSendVerificationToken(User user) {
        // Bước 1: Sinh token thô để gửi qua email, nhưng chỉ lưu hash vào DB.
        String rawToken = identityTokenService.generateRawToken();

        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setTokenHash(identityTokenService.hash(rawToken));
        verificationToken.setUser(user);
        verificationToken.setExpiresAt(Instant.now().plusSeconds(emailVerificationProperties.getTokenTtlSeconds()));
        verificationToken.setVerifiedAt(null);
        emailVerificationTokenRepository.save(verificationToken);

        // Bước 2: Gửi email xác minh cho user sau khi token đã được lưu.
        identityEmailService.sendVerificationEmail(user, rawToken);
    }
}
