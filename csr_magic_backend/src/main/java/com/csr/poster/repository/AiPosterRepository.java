package com.csr.poster.repository;

import com.csr.poster.entity.AiPoster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiPosterRepository extends JpaRepository<AiPoster, Long> {

    Optional<AiPoster> findByTaskId(String taskId);

    Page<AiPoster> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
