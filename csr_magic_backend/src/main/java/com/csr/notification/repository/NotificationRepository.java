package com.csr.notification.repository;

import com.csr.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsReadByUserId(Long userId);

    @Query(value = "SELECT n FROM Notification n JOIN FETCH n.user u WHERE u.role <> 'ADMIN' ORDER BY n.createdAt DESC",
           countQuery = "SELECT COUNT(n) FROM Notification n WHERE n.user.role <> 'ADMIN'")
    Page<Notification> findAdminNotifications(Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.role <> 'ADMIN' AND n.isRead = false")
    long countAdminUnreadNotifications();

    @Query("SELECT n FROM Notification n JOIN FETCH n.user u WHERE n.id = :id AND u.role <> 'ADMIN'")
    Optional<Notification> findAdminNotificationById(Long id);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.role <> 'ADMIN' AND n.isRead = false")
    int markAllAdminNotificationsAsRead();
}
