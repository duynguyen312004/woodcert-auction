package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.dto.request.LoginReq;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.dto.response.AuthRes;
import com.woodcert.auction.feature.identity.dto.response.RefreshRes;
import com.woodcert.auction.feature.identity.dto.response.RegisterRes;

/**
 * Authentication service interface.
 * Handles login, registration, token refresh, and logout.
 */
public interface AuthService {

    /**
     * Authenticate user by email + password, return tokens.
     */
    AuthRes login(LoginReq request);

    /**
     * Register a new user account (default role: ROLE_BIDDER, status: UNVERIFIED).
     */
    RegisterRes register(RegisterReq request);

    /**
     * Verify a user's email using the raw token sent to their inbox.
     */
    void verifyEmail(String rawToken);

    /**
     * Resend the verification email if the account exists and is still unverified.
     */
    void resendVerificationEmail(String email);

    /**
     * Refresh access token using a raw refresh token.
     * Implements token rotation: old token revoked, new pair issued.
     *
     * @param rawRefreshToken the raw (unhashed) refresh token
     * @return new token pair
     */
    RefreshRes refresh(String rawRefreshToken);

    /**
     * Logout — revoke the refresh token.
     *
     * @param rawRefreshToken the raw (unhashed) refresh token
     */
    void logout(String rawRefreshToken);
}
