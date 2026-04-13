package com.csr.user.service;

import com.csr.user.dto.UpdateUserRequest;
import com.csr.user.dto.UserDetailResponse;
import com.csr.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    Page<UserResponse> list(String keyword, String region, Pageable pageable);

    UserDetailResponse getById(Long id);

    UserResponse update(Long id, UpdateUserRequest request);

    void delete(Long id);

    void resetPassword(Long id, String newPassword);
}
