package com.csr.poster.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.poster.dto.GeneratePosterRequest;
import com.csr.poster.dto.GenerateTaskResponse;
import com.csr.poster.dto.PosterResponse;
import com.csr.poster.dto.PosterStatusResponse;
import com.csr.poster.entity.AiPoster;
import com.csr.poster.repository.AiPosterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PosterServiceImplTest {

    @Mock
    private AiPosterRepository aiPosterRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PosterServiceImpl posterService;

    private Activity testActivity;
    private AiPoster testPoster;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(posterService, "aiServiceBaseUrl", "http://localhost:8000");

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setName("春季植树活动");
        testActivity.setTemplateType(TemplateType.VOLUNTEER);

        testPoster = new AiPoster();
        testPoster.setId(10L);
        testPoster.setUserId(1L);
        testPoster.setActivityId(1L);
        testPoster.setTaskId("abc123");
        testPoster.setStyle("cartoon");
        testPoster.setStatus("PENDING");
        ReflectionTestUtils.setField(testPoster, "createdAt", Instant.parse("2026-04-15T10:00:00Z"));
    }

    @Test
    @DisplayName("生成海报：成功创建任务记录并返回 taskId")
    void generate_success() {
        GeneratePosterRequest request = new GeneratePosterRequest(1L, "cartoon", "阳光植树");
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(aiPosterRepository.save(any(AiPoster.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerateTaskResponse response = posterService.generate(request, 1L);

        assertNotNull(response.taskId());
        assertFalse(response.taskId().isEmpty());

        ArgumentCaptor<AiPoster> captor = ArgumentCaptor.forClass(AiPoster.class);
        verify(aiPosterRepository).save(captor.capture());
        AiPoster saved = captor.getValue();
        assertEquals(1L, saved.getUserId());
        assertEquals(1L, saved.getActivityId());
        assertEquals("cartoon", saved.getStyle());
        assertEquals("PENDING", saved.getStatus());
        assertEquals("阳光植树", saved.getUserPrompt());
    }

    @Test
    @DisplayName("生成海报：活动不存在时抛出 404")
    void generate_activityNotFound() {
        GeneratePosterRequest request = new GeneratePosterRequest(999L, "cartoon", null);
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> posterService.generate(request, 1L));

        assertEquals(404, ex.getCode());
        assertEquals("活动不存在", ex.getMessage());
    }

    @Test
    @DisplayName("查询状态：返回正确的状态信息")
    void getStatus_success() {
        when(aiPosterRepository.findByTaskId("abc123")).thenReturn(Optional.of(testPoster));

        PosterStatusResponse response = posterService.getStatus("abc123", 1L);

        assertEquals("abc123", response.taskId());
        assertEquals("PENDING", response.status());
    }

    @Test
    @DisplayName("查询状态：任务不存在时抛出 404")
    void getStatus_notFound() {
        when(aiPosterRepository.findByTaskId("nonexist")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> posterService.getStatus("nonexist", 1L));

        assertEquals(404, ex.getCode());
    }

    @Test
    @DisplayName("查询状态：非任务所有者时抛出 403")
    void getStatus_forbidden() {
        when(aiPosterRepository.findByTaskId("abc123")).thenReturn(Optional.of(testPoster));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> posterService.getStatus("abc123", 999L));

        assertEquals(403, ex.getCode());
    }

    @Test
    @DisplayName("我的海报列表：返回分页结果")
    void getMyPosters_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<AiPoster> page = new PageImpl<>(List.of(testPoster), pageable, 1);
        when(aiPosterRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<PosterResponse> result = posterService.getMyPosters(1L, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("abc123", result.getContent().get(0).taskId());
        assertEquals("cartoon", result.getContent().get(0).style());
    }
}
