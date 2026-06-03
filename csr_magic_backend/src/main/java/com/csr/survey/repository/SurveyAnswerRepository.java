package com.csr.survey.repository;

import com.csr.survey.entity.SurveyAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Long> {

    List<SurveyAnswer> findByResponseId(Long responseId);

    @Query("SELECT a.answerValue AS val, COUNT(a) AS cnt FROM SurveyAnswer a WHERE a.questionId = :qid GROUP BY a.answerValue")
    List<Map<String, Object>> countByQuestionGroupValue(@Param("qid") Long questionId);

    @Query("SELECT a.answerValue FROM SurveyAnswer a WHERE a.questionId = :qid")
    List<String> findAllValuesByQuestion(@Param("qid") Long questionId);
}
