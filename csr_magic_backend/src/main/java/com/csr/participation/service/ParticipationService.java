package com.csr.participation.service;

import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;

public interface ParticipationService {

    ParticipationResponse signup(Long userId, SignupRequest request);

    void withdraw(Long participationId, Long userId);
}
