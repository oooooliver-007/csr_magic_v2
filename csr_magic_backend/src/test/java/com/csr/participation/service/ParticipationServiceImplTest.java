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
import com.csr.participation.dto.FamilyMemberDto;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.entity.FamilyRelation;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
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

    // === 家属同行测试 ===

    @Test
    @DisplayName("报名：活动不允许携带家属时带家属报名被拒绝")
    void signup_familyNotAllowed() {
        testActivity.setAllowFamily(false);
        SignupRequest request = new SignupRequest(1L, null,
            List.of(new FamilyMemberDto("张三", FamilyRelation.SPOUSE)));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("不允许携带家属"));
    }

    @Test
    @DisplayName("报名：携带家属数超过 maxFamilyPerUser 时被拒绝")
    void signup_familyExceedsMaxPerUser() {
        testActivity.setAllowFamily(true);
        testActivity.setMaxFamilyPerUser(2);
        SignupRequest request = new SignupRequest(1L, null,
            List.of(
                new FamilyMemberDto("张三", FamilyRelation.SPOUSE),
                new FamilyMemberDto("李四", FamilyRelation.CHILD),
                new FamilyMemberDto("王五", FamilyRelation.PARENT)
            ));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("家属人数限制"));
    }

    @Test
    @DisplayName("报名：合并名额超过 maxParticipants 时被拒绝")
    void signup_familyExceedsMaxParticipants() {
        testActivity.setAllowFamily(true);
        testActivity.setMaxFamilyPerUser(5);
        testActivity.setMaxParticipants(10);
        SignupRequest request = new SignupRequest(1L, null,
            List.of(
                new FamilyMemberDto("张三", FamilyRelation.SPOUSE),
                new FamilyMemberDto("李四", FamilyRelation.CHILD)
            ));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(100L, 1L)).thenReturn(false);
        when(userActivityRepository.countByActivityId(1L)).thenReturn(5L);
        when(userActivityRepository.sumOccupiedSlots(1L)).thenReturn(9L);

        BusinessException ex = assertThrows(BusinessException.class,
            () -> participationService.signup(100L, request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("剩余名额"));
    }

    @Test
    @DisplayName("报名：正常携带家属持久化成功并反序列化正确")
    void signup_withFamilySuccess() {
        testActivity.setAllowFamily(true);
        testActivity.setMaxFamilyPerUser(3);
        SignupRequest request = new SignupRequest(1L, "{\"amount\":100}",
            List.of(
                new FamilyMemberDto("张三", FamilyRelation.SPOUSE),
                new FamilyMemberDto("李四", FamilyRelation.CHILD)
            ));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(100L, 1L)).thenReturn(false);
        when(userActivityRepository.countByActivityId(1L)).thenReturn(5L);
        when(userActivityRepository.sumOccupiedSlots(1L)).thenReturn(7L);
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(userActivityRepository.save(any(UserActivity.class))).thenAnswer(inv -> {
            UserActivity ua = inv.getArgument(0);
            ua.setId(1L);
            ReflectionTestUtils.setField(ua, "createdAt", Instant.now());
            return ua;
        });

        ParticipationResponse response = participationService.signup(100L, request);

        assertNotNull(response);
        assertEquals("PENDING", response.state());
        assertNotNull(response.familyMembers());
        assertEquals(2, response.familyMembers().size());
        assertEquals("张三", response.familyMembers().get(0).name());
        assertEquals(FamilyRelation.SPOUSE, response.familyMembers().get(0).relation());
    }

    @Test
    @DisplayName("审核待办：只查询 PENDING 和 RE_SUBMITTED 状态")
    void getReviewTodos_queriesPendingAndResubmitted() {
        UserActivity pending = new UserActivity();
        pending.setId(1L);
        pending.setUser(testUser);
        pending.setActivity(testActivity);
        pending.setState(ParticipationState.PENDING);
        ReflectionTestUtils.setField(pending, "createdAt", Instant.parse("2026-04-14T10:00:00Z"));

        PageRequest pageable = PageRequest.of(0, 5);
        when(userActivityRepository.findReviewTodos(any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(pending), pageable, 1));

        Page<ParticipationResponse> response = participationService.getReviewTodos(pageable);

        assertEquals(1, response.getTotalElements());
        assertEquals("PENDING", response.getContent().get(0).state());
        verify(userActivityRepository).findReviewTodos(pageable);
    }
}
