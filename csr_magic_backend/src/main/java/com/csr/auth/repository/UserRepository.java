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

    @Query("SELECT u FROM User u WHERE " +
            "(:keyword = '' OR lower(u.username) LIKE lower(concat(concat('%', :keyword), '%')) " +
            "OR lower(u.displayName) LIKE lower(concat(concat('%', :keyword), '%')) " +
            "OR lower(u.realName) LIKE lower(concat(concat('%', :keyword), '%'))) " +
            "AND (:region = '' OR u.region = :region)")
    Page<User> findByFilters(String keyword, String region, Pageable pageable);
}