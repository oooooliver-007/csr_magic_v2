package com.csr.poster.service;

import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PosterService {

    GenerateTaskResponse generate(GeneratePosterRequest request, Long userId);

    PosterStatusResponse getStatus(String taskId, Long userId);

    Page<PosterResponse> getMyPosters(Long userId, Pageable pageable);
}
