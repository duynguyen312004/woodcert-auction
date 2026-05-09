package com.woodcert.auction.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.repository.BidRepository;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalImageRepository;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.finance.entity.Wallet;
import com.woodcert.auction.feature.finance.repository.WalletOperationRepository;
import com.woodcert.auction.feature.finance.repository.WalletRepository;
import com.woodcert.auction.feature.finance.repository.WalletTransactionRepository;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class AuctionIntegrationTestBase {

    @SuppressWarnings("resource")
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("woodcert_auction_test")
            .withUsername("woodcert")
            .withPassword("woodcert");

    @SuppressWarnings("resource")
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7.0-alpine")
            .withExposedPorts(6379);

    static {
        MYSQL.start();
        REDIS.start();
        // Ensure containers are stopped when JVM exits to avoid resource leaks
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                REDIS.stop();
            } catch (Exception ignored) {
            }
            try {
                MYSQL.stop();
            } catch (Exception ignored) {
            }
        }));
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("spring.sql.init.mode", () -> "never");
        registry.add("jwt.secret-key", () -> "test-secret-key-that-is-long-enough-for-hs512-runtime-tests");
        registry.add("identity.location-seed.enabled", () -> "false");
        registry.add("identity.refresh-token-cleanup.enabled", () -> "false");
        registry.add("auction.scheduler.enabled", () -> "false");
        registry.add("cloudinary.cleanup.enabled", () -> "false");
        registry.add("finance.wallet.top-up-enabled", () -> "true");
        registry.add("logging.level.org.hibernate.SQL", () -> "WARN");
        registry.add("logging.level.org.springframework", () -> "WARN");
    }

    @Autowired
    protected MockMvc mockMvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected StringRedisTemplate redisTemplate;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected SellerProfileRepository sellerProfileRepository;
    @Autowired
    protected ProductRepository productRepository;
    @Autowired
    protected CategoryRepository categoryRepository;
    @Autowired
    protected AppraisalReportRepository appraisalReportRepository;
    @Autowired
    protected AppraisalImageRepository appraisalImageRepository;
    @Autowired
    protected ProductImageRepository productImageRepository;
    @Autowired
    protected AuctionSessionRepository auctionSessionRepository;
    @Autowired
    protected AuctionParticipantRepository auctionParticipantRepository;
    @Autowired
    protected BidRepository bidRepository;
    @Autowired
    protected WalletRepository walletRepository;
    @Autowired
    protected WalletTransactionRepository walletTransactionRepository;
    @Autowired
    protected WalletOperationRepository walletOperationRepository;

    @BeforeEach
    void cleanState() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        bidRepository.deleteAll();
        auctionParticipantRepository.deleteAll();
        auctionSessionRepository.deleteAll();
        appraisalImageRepository.deleteAll();
        appraisalReportRepository.deleteAll();
        productImageRepository.deleteAll();
        productRepository.deleteAll();
        walletOperationRepository.deleteAll();
        walletTransactionRepository.deleteAll();
        walletRepository.deleteAll();
        sellerProfileRepository.deleteAll();
        userRepository.deleteAll();
        ensureCategory();
    }

    protected User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("{noop}password");
        user.setFullName(email.substring(0, email.indexOf('@')));
        user.setPhoneNumber(null);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.saveAndFlush(user);
    }

    protected User createSeller(String email) {
        return createUser(email);
    }

    protected Wallet createWallet(String userId, BigDecimal available, BigDecimal frozen) {
        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setAvailableBalance(available);
        wallet.setFrozenBalance(frozen);
        return walletRepository.saveAndFlush(wallet);
    }

    protected Product createAppraisedProduct(String sellerId) {
        Product product = new Product();
        product.setSellerId(sellerId);
        product.setCategoryId(ensureCategory().getId());
        product.setTitle("Wood statue");
        product.setDescription("Hand carved");
        product.setMaterial("Seller material");
        product.setDimensions("10x20x30");
        product.setWeight(new BigDecimal("12.50"));
        product.setStatus(ProductStatus.APPRAISED);
        Product saved = productRepository.saveAndFlush(product);

        AppraisalReport report = new AppraisalReport();
        report.setProductId(saved.getId());
        report.setAppraiserId(sellerId);
        report.setCertificateCode("CERT-IT-" + saved.getId());
        report.setVerifiedMaterial("Verified rosewood");
        report.setOrigin("Vietnam");
        report.setAgeEstimation("20 years");
        report.setConditionGrade(ConditionGrade.EXCELLENT);
        report.setEstimatedValue(new BigDecimal("20000000.00"));
        report.setAuthentic(true);
        report.setAppraiserNotes("Verified");
        report.setSellerAccuracy(new BigDecimal("5.00"));
        report.setDigitalSignature("signature-" + saved.getId());
        report.setAppraisedAt(Instant.now());
        appraisalReportRepository.saveAndFlush(report);

        return saved;
    }

    protected AuctionSession createSession(Product product, AuctionSessionStatus status, Instant startTime,
            Instant endTime, BigDecimal reservePrice) {
        AuctionSession session = new AuctionSession();
        session.setProductId(product.getId());
        session.setStartingPrice(new BigDecimal("10000000.00"));
        session.setReservePrice(reservePrice);
        session.setStepPrice(new BigDecimal("100000.00"));
        session.setDepositAmount(new BigDecimal("1000000.00"));
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.setCurrentPrice(new BigDecimal("10000000.00"));
        session.setStatus(status);
        return auctionSessionRepository.saveAndFlush(session);
    }

    protected AuctionParticipant createParticipant(Long auctionId, String userId, BigDecimal depositAmount) {
        AuctionParticipant participant = new AuctionParticipant();
        participant.setAuctionSessionId(auctionId);
        participant.setUserId(userId);
        participant.setDepositAmount(depositAmount);
        participant.setDepositStatus(DepositStatus.FROZEN);
        return auctionParticipantRepository.saveAndFlush(participant);
    }

    protected Collection<GrantedAuthority> authorities(String... permissions) {
        return java.util.Arrays.stream(permissions)
                .<GrantedAuthority>map(SimpleGrantedAuthority::new)
                .toList();
    }

    private Category ensureCategory() {
        return categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category category = new Category();
            category.setName("Integration Category");
            category.setSlug("integration-category");
            category.setDescription("Integration tests");
            return categoryRepository.saveAndFlush(category);
        });
    }
}
