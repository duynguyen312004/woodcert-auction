package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, String id);

    // Tìm kiếm user có lọc theo role, status và từ khóa (email/họ tên) phục vụ admin.
    @Query("""
            SELECT DISTINCT u
            FROM User u
            LEFT JOIN u.roles r
            WHERE (:role IS NULL OR r.name = :role)
                AND (:status IS NULL OR u.status = :status)
                AND (:query IS NULL
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY u.createdAt DESC
            """)
    Page<User> searchUsersFiltered(@Param("role") String role,
                                   @Param("status") UserStatus status,
                                   @Param("query") String query,
                                   Pageable pageable);
}
