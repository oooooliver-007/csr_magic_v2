package com.csr.auth.repository;

import com.csr.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query(value = "SELECT * FROM users u WHERE " +
            "(:keyword IS NULL OR (u.username ILIKE '%' || CAST(:keyword AS TEXT) || '%' " +
            "OR u.display_name ILIKE '%' || CAST(:keyword AS TEXT) || '%' " +
            "OR u.real_name ILIKE '%' || CAST(:keyword AS TEXT) || '%')) " +
            "AND (:region IS NULL OR u.region = CAST(:region AS TEXT))",
            countQuery = "SELECT COUNT(*) FROM users u WHERE " +
            "(:keyword IS NULL OR (u.username ILIKE '%' || CAST(:keyword AS TEXT) || '%' " +
            "OR u.display_name ILIKE '%' || CAST(:keyword AS TEXT) || '%' " +
            "OR u.real_name ILIKE '%' || CAST(:keyword AS TEXT) || '%')) " +
            "AND (:region IS NULL OR u.region = CAST(:region AS TEXT))",
            nativeQuery = true)
    Page<User> findByFilters(String keyword, String region, Pageable pageable);
}
