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

    byte[] getPosterImage(String taskId, Long userId);

    /** 无认证的图片读取，通过 taskId UUID 隐式鉴权 */
    byte[] getPosterImageByTaskId(String taskId);
}
