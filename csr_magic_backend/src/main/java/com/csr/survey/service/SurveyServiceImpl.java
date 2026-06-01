package com.csr.survey.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.notification.service.NotificationService;
import com.csr.survey.dto.*;
import com.csr.survey.entity.Survey;
import com.csr.survey.entity.SurveyAnswer;
import com.csr.survey.entity.SurveyQuestion;
import com.csr.survey.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SurveyServiceImpl implements SurveyService {

    private static final Logger log = LoggerFactory.getLogger(SurveyServiceImpl.class);

    private final SurveyRepository surveyRepository;
    private final SurveyQuestionRepository questionRepository;
    private final SurveyResponseRepository responseRepository;
    private final SurveyAnswerRepository answerRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public SurveyServiceImpl(
            SurveyRepository surveyRepository,
            SurveyQuestionRepository questionRepository,
            SurveyResponseRepository responseRepository,
            SurveyAnswerRepository answerRepository,
            ActivityRepository activityRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.questionRepository = questionRepository;
        this.responseRepository = responseRepository;
        this.answerRepository = answerRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    @Override
    public AiGeneratedSurveyResponse generateWithAi(GenerateSurveyRequest request) {
        Activity activity = activityRepository.findById(request.activityId())
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (surveyRepository.existsByActivityId(request.activityId())) {
            throw new BusinessException(400, "该活动已存在问卷");
        }

        try {
            Map<String, Object> body = Map.of(
                    "activity_name", activity.getName(),
                    "activity_description", activity.getDescription() != null ? activity.getDescription() : "",
                    "template_type", activity.getTemplateType().name()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    aiServiceBaseUrl + "/survey/generate", entity, Map.class);

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                return objectMapper.convertValue(data, AiGeneratedSurveyResponse.class);
            }

            throw new BusinessException(500, "AI 服务返回数据异常");

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用 AI 问卷生成服务失败: {}", e.getMessage());
            throw new BusinessException(500, "AI 问卷生成失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public SurveyResponse create(CreateSurveyRequest request) {
        Activity activity = activityRepository.findById(request.activityId())
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (surveyRepository.existsByActivityId(request.activityId())) {
            throw new BusinessException(400, "该活动已存在问卷");
        }

        Survey survey = new Survey();
        survey.setActivityId(request.activityId());
        survey.setTitle(request.title());
        survey.setDescription(request.description());
        survey.setStatus("DRAFT");
        Survey saved = surveyRepository.save(survey);

        List<SurveyQuestion> questions = new ArrayList<>();
        for (int i = 0; i < request.questions().size(); i++) {
            var q = request.questions().get(i);
            SurveyQuestion question = new SurveyQuestion();
            question.setSurveyId(saved.getId());
            question.setQuestionText(q.questionText());
            question.setQuestionType(q.questionType());
            question.setRequired(q.required() != null ? q.required() : true);
            question.setSortOrder(q.sortOrder() != null ? q.sortOrder() : i);

            if (q.options() != null && !q.options().isEmpty()) {
                try {
                    question.setOptions(objectMapper.writeValueAsString(q.options()));
                } catch (JsonProcessingException e) {
                    log.warn("序列化选项失败: {}", e.getMessage());
                }
            }

            questions.add(question);
        }
        questionRepository.saveAll(questions);

        log.info("创建问卷: id={}, activityId={}, 题目数={}", saved.getId(), request.activityId(), questions.size());

        List<SurveyResponse.QuestionResponse> questionResponses = questions.stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return SurveyResponse.from(saved, questionResponses, 0);
    }

    @Override
    public SurveyResponse getByActivityId(Long activityId) {
        Survey survey = surveyRepository.findByActivityId(activityId)
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        return buildSurveyResponse(survey);
    }

    @Override
    public SurveyResponse getById(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        return buildSurveyResponse(survey);
    }

    @Override
    public Page<SurveyResponse> list(String keyword, String status, Pageable pageable) {
        return surveyRepository.findByFilters(keyword, status, pageable)
                .map(survey -> {
                    List<SurveyQuestion> questions = questionRepository.findBySurveyIdOrderBySortOrderAsc(survey.getId());
                    int responseCount = (int) responseRepository.countBySurveyId(survey.getId());
                    List<SurveyResponse.QuestionResponse> qrs = questions.stream()
                            .map(this::toQuestionResponse)
                            .collect(Collectors.toList());
                    return SurveyResponse.from(survey, qrs, responseCount);
                });
    }

    @Override
    @Transactional
    public void publish(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        if (!"DRAFT".equals(survey.getStatus())) {
            throw new BusinessException(400, "仅草稿状态的问卷可发布");
        }

        survey.setStatus("PUBLISHED");
        surveyRepository.save(survey);

        // 向已报名且确认参与的用户发送通知
        // 简化处理：通过 activity 关联查找参与用户
        Activity activity = activityRepository.findById(survey.getActivityId())
                .orElse(null);
        if (activity != null) {
            String notificationContent = "活动「" + activity.getName() + "」发布了反馈问卷，点击查看并填写。";
            // 实际项目中应查询已报名用户列表并逐个发送通知
            // 此处简化：仅记录日志
            log.info("问卷发布通知: surveyId={}, activityName={}", id, activity.getName());
        }
    }

    @Override
    @Transactional
    public void close(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        if (!"PUBLISHED".equals(survey.getStatus())) {
            throw new BusinessException(400, "仅已发布状态的问卷可关闭");
        }

        survey.setStatus("CLOSED");
        surveyRepository.save(survey);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!surveyRepository.existsById(id)) {
            throw new BusinessException(404, "问卷不存在");
        }
        surveyRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void submit(SubmitSurveyRequest request, Long userId) {
        Survey survey = surveyRepository.findById(request.surveyId())
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        if (!"PUBLISHED".equals(survey.getStatus())) {
            throw new BusinessException(400, "问卷未发布，无法提交");
        }

        if (responseRepository.existsBySurveyIdAndUserId(request.surveyId(), userId)) {
            throw new BusinessException(400, "您已提交过该问卷");
        }

        // 校验必填项
        List<SurveyQuestion> questions = questionRepository.findBySurveyIdOrderBySortOrderAsc(request.surveyId());
        Set<Long> answeredIds = request.answers().stream()
                .map(SubmitSurveyRequest.AnswerItem::questionId)
                .collect(Collectors.toSet());

        for (SurveyQuestion q : questions) {
            if (Boolean.TRUE.equals(q.getRequired()) && !answeredIds.contains(q.getId())) {
                throw new BusinessException(400, "请回答必填题目: " + q.getQuestionText());
            }
        }

        // 计算情感分
        double sentimentScore = calculateSentiment(request.answers(), questions);

        // 保存答卷
        com.csr.survey.entity.SurveyResponse response = new com.csr.survey.entity.SurveyResponse();
        response.setSurveyId(request.surveyId());
        response.setUserId(userId);
        response.setSentimentScore(sentimentScore);
        com.csr.survey.entity.SurveyResponse savedResponse = responseRepository.save(response);

        // 保存答案
        List<SurveyAnswer> answers = request.answers().stream().map(a -> {
            SurveyAnswer answer = new SurveyAnswer();
            answer.setResponseId(savedResponse.getId());
            answer.setQuestionId(a.questionId());
            answer.setAnswerValue(a.answerValue());
            return answer;
        }).collect(Collectors.toList());
        answerRepository.saveAll(answers);

        log.info("用户提交问卷: surveyId={}, userId={}, sentimentScore={}", request.surveyId(), userId, sentimentScore);
    }

    @Override
    public boolean hasUserSubmitted(Long surveyId, Long userId) {
        return responseRepository.existsBySurveyIdAndUserId(surveyId, userId);
    }

    @Override
    public Page<SurveyResultResponse> getResults(Long surveyId, Pageable pageable) {
        List<SurveyQuestion> questions = questionRepository.findBySurveyIdOrderBySortOrderAsc(surveyId);

        return responseRepository.findBySurveyId(surveyId, pageable)
                .map(response -> {
                    User user = userRepository.findById(response.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "未知";
                    String displayName = user != null ? user.getDisplayName() : null;

                    List<SurveyAnswer> answers = answerRepository.findByResponseId(response.getId());
                    Map<Long, String> answerMap = answers.stream()
                            .collect(Collectors.toMap(SurveyAnswer::getQuestionId, SurveyAnswer::getAnswerValue));

                    List<SurveyResultResponse.AnswerResult> answerResults = questions.stream()
                            .map(q -> new SurveyResultResponse.AnswerResult(
                                    q.getId(),
                                    q.getQuestionText(),
                                    q.getQuestionType(),
                                    answerMap.getOrDefault(q.getId(), "")
                            ))
                            .collect(Collectors.toList());

                    return SurveyResultResponse.from(response, username, displayName, answerResults);
                });
    }

    @Override
    public SurveyStatsResponse getStats(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new BusinessException(404, "问卷不存在"));

        int responseCount = (int) responseRepository.countBySurveyId(surveyId);
        double avgSentiment = responseRepository.getAverageSentimentBySurveyId(surveyId);
        int totalQuestions = questionRepository.findBySurveyIdOrderBySortOrderAsc(surveyId).size();

        return new SurveyStatsResponse(
                surveyId,
                survey.getTitle(),
                responseCount,
                Math.round(avgSentiment * 100.0) / 100.0,
                totalQuestions
        );
    }

    private SurveyResponse buildSurveyResponse(Survey survey) {
        List<SurveyQuestion> questions = questionRepository.findBySurveyIdOrderBySortOrderAsc(survey.getId());
        int responseCount = (int) responseRepository.countBySurveyId(survey.getId());
        List<SurveyResponse.QuestionResponse> qrs = questions.stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());
        return SurveyResponse.from(survey, qrs, responseCount);
    }

    private SurveyResponse.QuestionResponse toQuestionResponse(SurveyQuestion q) {
        List<String> optionList = null;
        if (q.getOptions() != null && !q.getOptions().isEmpty()) {
            try {
                optionList = objectMapper.readValue(q.getOptions(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException e) {
                log.warn("反序列化选项失败: questionId={}", q.getId());
            }
        }
        return new SurveyResponse.QuestionResponse(
                q.getId(),
                q.getQuestionText(),
                q.getQuestionType(),
                optionList,
                q.getRequired(),
                q.getSortOrder()
        );
    }

    private double calculateSentiment(List<SubmitSurveyRequest.AnswerItem> answers,
                                       List<SurveyQuestion> questions) {
        Map<Long, String> typeMap = questions.stream()
                .collect(Collectors.toMap(SurveyQuestion::getId, SurveyQuestion::getQuestionType));

        double totalScore = 0;
        int scoredCount = 0;

        for (SubmitSurveyRequest.AnswerItem answer : answers) {
            String type = typeMap.get(answer.questionId());
            if ("RATING".equals(type) && answer.answerValue() != null) {
                try {
                    int rating = Integer.parseInt(answer.answerValue().trim());
                    if (rating >= 1 && rating <= 5) {
                        totalScore += (rating - 1) / 4.0; // 归一化到 0-1
                        scoredCount++;
                    }
                } catch (NumberFormatException ignored) {
                }
            } else if ("CHOICE".equals(type) && answer.answerValue() != null) {
                // 选择题默认中性 0.5
                totalScore += 0.5;
                scoredCount++;
            }
        }

        return scoredCount > 0 ? totalScore / scoredCount : 0.5;
    }
}
