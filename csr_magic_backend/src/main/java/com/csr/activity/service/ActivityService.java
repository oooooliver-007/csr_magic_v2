package com.csr.activity.service;

import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ActivityService {

    Page<ActivityResponse> list(Long eventId, String status, String keyword, Pageable pageable);

    ActivityResponse getById(Long id);

    ActivityResponse create(CreateActivityRequest request);

    ActivityResponse update(Long id, UpdateActivityRequest request);

    void delete(Long id);
}
