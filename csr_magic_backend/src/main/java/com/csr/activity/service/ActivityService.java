package com.csr.activity.service;

import com.csr.activity.dto.ActivityDetailResponse;
import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ActivityService {

    Page<ActivityResponse> list(Long eventId, String status, String templateType, String keyword, Pageable pageable);

    ActivityResponse getById(Long id);

    ActivityDetailResponse getDetail(Long id, Long currentUserId);

    ActivityResponse create(CreateActivityRequest request);

    ActivityResponse update(Long id, UpdateActivityRequest request);

    void delete(Long id);
}
