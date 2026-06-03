package com.csr.survey.exception;

import com.csr.common.BusinessException;

public class SurveyNotFoundException extends BusinessException {
    public SurveyNotFoundException(Long id) {
        super(404, "问卷不存在: id=" + id);
    }
}
