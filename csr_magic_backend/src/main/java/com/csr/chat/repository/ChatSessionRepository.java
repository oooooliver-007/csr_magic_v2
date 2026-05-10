package com.csr.chat.repository;

import com.csr.chat.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {

    @Modifying
    @Query("DELETE FROM ChatSession cs WHERE cs.updatedAt < :threshold")
    int deleteStaleSessions(@Param("threshold") Instant threshold);
}
