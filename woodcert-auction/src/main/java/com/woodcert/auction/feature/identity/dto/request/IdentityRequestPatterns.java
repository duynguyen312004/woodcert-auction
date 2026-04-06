package com.woodcert.auction.feature.identity.dto.request;

/**
 * Shared validation patterns for identity request DTOs.
 */
public final class IdentityRequestPatterns {

    private IdentityRequestPatterns() {
    }

    public static final String HUMAN_NAME = "^\\s*[\\p{L}\\p{M}][\\p{L}\\p{M}\\s.'-]*\\s*$";
    public static final String STORE_NAME = "^\\s*[\\p{L}\\p{M}0-9][\\p{L}\\p{M}0-9\\s.'&()/,-]*\\s*$";
    public static final String VIETNAMESE_PHONE = "^\\s*(0|\\+84)\\d{9,10}\\s*$";
    public static final String VIETNAMESE_PHONE_OR_BLANK = "^\\s*$|^\\s*(0|\\+84)\\d{9,10}\\s*$";
    public static final String PASSWORD = "^(?=.*[A-Za-z])(?=.*\\d)\\S+$";
    public static final String TOKEN_OR_BLANK = "^\\s*$|^[A-Za-z0-9-]{1,255}$";
    public static final String IDENTITY_CARD_NUMBER = "^\\s*(\\d{9}|\\d{12})\\s*$";
    public static final String TAX_CODE_OR_BLANK = "^\\s*$|^\\s*\\d{10}(?:-\\d{3})?\\s*$";
    public static final String HTTP_URL_OR_BLANK = "^\\s*$|^\\s*https?://\\S+\\s*$";
    public static final String PROVINCE_CODE = "^\\s*\\d{1,2}\\s*$";
    public static final String DISTRICT_CODE = "^\\s*\\d{1,3}\\s*$";
    public static final String WARD_CODE = "^\\s*\\d{1,5}\\s*$";
    public static final String STREET_ADDRESS = "^\\s*[\\p{L}\\p{M}0-9][\\p{L}\\p{M}0-9\\s,./()#-]*\\s*$";
}
