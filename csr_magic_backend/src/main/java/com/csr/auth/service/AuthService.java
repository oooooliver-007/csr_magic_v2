package com.csr.auth.service;

import com.csr.auth.dto.AuthResponse;
import com.csr.auth.dto.LoginRequest;
import com.csr.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    String refreshToken(String refreshToken);

    void logout(String accessToken, String refreshToken);
}
