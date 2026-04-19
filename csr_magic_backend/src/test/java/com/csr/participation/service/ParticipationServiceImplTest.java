package com.csr.participation.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.event.entity.Event;
import com.csr.notification.service.NotificationService;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.ResubmitRequest;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.exception.ParticipationNotFoundException;
import com.csr.participation.repository.UserActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceImplTest {

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ParticipationServiceImpl participationService;

    private Activity testActivity;
    private User testUser;

    @BeforeEach
    void setUp() {
        Event event = new Event();
        event.setId(1L);
        event.setName("测试事件");
        ReflectionTestUtils.setField(event, "createdAt", Instant.now());

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setEvent(event);
        testActivity.setName("测试活动");
        testActivity.setTemplateType(TemplateType.DONATION);
        testActivity.setStatus("ONGOING");
        testActivity.setMaxParticipants(10);
        ReflectionTestUtils.setField(testActivity, "createdAt", Instant.now());

        testUser = new User();
        testUser.setId(100L);
        testUser.setUsername("testuser");
    }

    // === 报名测试 ===

    @Test
    @DisplayName("报名：成功创建参与记录")
    void signup_success() {
        SignupRequest request = new SignupRequest(1L, "{\"amount\":100}");
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(100L, 1L)).thenReturn(false);
        when(userActivityRepository.countByActivityId(1L)).thenReturn(5L);
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(userActivityRepository.save(any(UserActivity.class))).thenAnswer(inv -> {
            UserActivity ua = inv.getArgument(0);
            ua.setId(1L);
            ReflectionTestUtils.setField(ua, "createdAt", Instant.now());
            return ua;
        });

        ParticipationResponse response = participationService.signup(100L, request);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("PENDING", response.state());
        verify(userActivityRepository).save(any(UserActivity.class));
        verify(notificationService).send(
            eq(testUser),
            eq("SIGNUP_SUCCESS"),
            eq("报名提交成功"),
            contains("测试活动")
        );
    }

    @Test
    @DisplayName("报名：活动不存在时抛出 ActivityNotFoundException")
    void signup_activityNotFound() {
        SignupRequest request = new SignupRequest(999L, null);
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ActivityNotFoundException.class,
            () -> participationService.signup(100L, request));
    }

    @Test
    @DisplayName("报名：活动已结束时抛出 BusinessException")
    void signup_activityEnded() {
        testActivity.setStatus("ENDED");
        SignupRequest request = new SignupRequest(1L, null);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已结束"));
    }

    @Test
    @DisplayName("报名：重复报名时抛出 BusinessException")
    void signup_duplicate() {
        SignupRequest request = new SignupRequest(1L, null);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(100L, 1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("重复"));
    }

    @Test
    @DisplayName("报名：名额已满时抛出 BusinessException")
    void signup_full() {
        SignupRequest request = new SignupRequest(1L, null);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(100L, 1L)).thenReturn(false);
        when(userActivityRepository.countByActivityId(1L)).thenReturn(10L); // max = 10

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("名额已满"));
    }

    // === 退出测试 ===

    @Test
    @DisplayName("退出：成功删除参与记录")
    void withdraw_success() {
        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        participationService.withdraw(1L, 100L);

        verify(userActivityRepository).delete(ua);
    }

    @Test
    @DisplayName("退出：参与记录不存在时抛出 ParticipationNotFoundException")
    void withdraw_notFound() {
        when(userActivityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ParticipationNotFoundException.class,
            () -> participationService.withdraw(999L, 100L));
    }

    @Test
    @DisplayName("退出：非本人记录时抛出 BusinessException")
    void withdraw_unauthorized() {
        User otherUser = new User();
        otherUser.setId(200L);

        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(otherUser);
        ua.setActivity(testActivity);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.withdraw(1L, 100L));
        assertEquals(403, ex.getCode());
    }

    // === 重新提交测试 ===

    @Test
    @DisplayName("重新提交：成功更新参与记录为 RE_SUBMITTED")
    void resubmit_success() {
        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ua.setState(ParticipationState.REJECTED);
        ua.setRejectReason("材料不完整");
        ua.setFormData("{\"amount\":50}");
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));
        when(userActivityRepository.save(any(UserActivity.class))).thenAnswer(inv -> inv.getArgument(0));

        ResubmitRequest request = new ResubmitRequest("{\"amount\":200}");
        ParticipationResponse response = participationService.resubmit(1L, 100L, request);

        assertEquals("RE_SUBMITTED", response.state());
        assertEquals("{\"amount\":200}", response.formData());
        assertNull(response.rejectReason());
        assertNull(response.reviewedById());
        verify(userActivityRepository).save(ua);
        verify(notificationService).send(
            eq(testUser),
            eq("SIGNUP_SUCCESS"),
            eq("报名重新提交成功"),
            contains("测试活动")
        );
    }

    @Test
    @DisplayName("重新提交：参与记录不存在时抛出 ParticipationNotFoundException")
    void resubmit_notFound() {
        when(userActivityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ParticipationNotFoundException.class,
            () -> participationService.resubmit(999L, 100L, new ResubmitRequest(null)));
    }

    @Test
    @DisplayName("重新提交：非本人记录时抛出 403")
    void resubmit_unauthorized() {
        User otherUser = new User();
        otherUser.setId(200L);

        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(otherUser);
        ua.setActivity(testActivity);
        ua.setState(ParticipationState.REJECTED);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.resubmit(1L, 100L, new ResubmitRequest(null)));
        assertEquals(403, ex.getCode());
    }

    @Test
    @DisplayName("重新提交：非驳回状态时抛出 400")
    void resubmit_wrongState() {
        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ua.setState(ParticipationState.PENDING);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.resubmit(1L, 100L, new ResubmitRequest(null)));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已驳回"));
    }

    @Test
    @DisplayName("重新提交：活动已结束时抛出 400")
    void resubmit_activityEnded() {
        testActivity.setStatus("ENDED");

        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ua.setState(ParticipationState.REJECTED);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.resubmit(1L, 100L, new ResubmitRequest(null)));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已结束"));
    }

    @Test
    @DisplayName("退出：活动已结束时抛出 BusinessException")
    void withdraw_activityEnded() {
        testActivity.setStatus("ENDED");

        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.now());

        when(userActivityRepository.findById(1L)).thenReturn(Optional.of(ua));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.withdraw(1L, 100L));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已结束"));
    }
}
