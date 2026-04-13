package com.csr.participation.service;

import com.csr.participation.dto.MyParticipationResponse;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ParticipationService {

    ParticipationResponse signup(Long userId, SignupRequest request);

    void withdraw(Long participationId, Long userId);

    Page<MyParticipationResponse> getMyParticipations(Long userId, Pageable pageable);
}
