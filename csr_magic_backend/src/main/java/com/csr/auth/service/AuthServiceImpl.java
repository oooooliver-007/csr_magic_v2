package com.csr.auth.service;

import com.csr.auth.dto.*;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.common.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException(409, "用户名已存在");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setRegion(request.region());
        user.setGender(request.gender());

        User saved = userRepository.save(user);
        log.info("用户注册成功: username={}", saved.getUsername());

        String accessToken = jwtUtil.generateAccessToken(saved.getId(), saved.getUsername(), saved.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(saved.getId());

        return new AuthResponse(accessToken, refreshToken, UserResponse.from(saved));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        log.info("用户登录成功: username={}", user.getUsername());

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return new AuthResponse(accessToken, refreshToken, UserResponse.from(user));
    }
}
