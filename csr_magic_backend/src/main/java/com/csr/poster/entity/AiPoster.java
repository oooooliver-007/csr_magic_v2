package com.csr.poster.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_poster")
public class AiPoster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long activityId;

    @Column(unique = true, length = 100)
    private String taskId;

    @Column(columnDefinition = "TEXT")
    private String userPrompt;

    @Column(length = 50)
    private String style;

    @Column(length = 20)
    private String status;

    @Column(length = 500)
    private String posterUrl;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getUserPrompt() { return userPrompt; }
    public void setUserPrompt(String userPrompt) { this.userPrompt = userPrompt; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
