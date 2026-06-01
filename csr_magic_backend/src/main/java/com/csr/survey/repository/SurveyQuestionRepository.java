package com.csr.survey.repository;

import com.csr.survey.entity.SurveyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, Long> {

    List<SurveyQuestion> findBySurveyIdOrderBySortOrderAsc(Long surveyId);

    void deleteBySurveyId(Long surveyId);
}
