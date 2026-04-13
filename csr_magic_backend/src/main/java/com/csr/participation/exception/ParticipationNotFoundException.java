package com.csr.participation.exception;

import com.csr.common.BusinessException;

public class ParticipationNotFoundException extends BusinessException {
    public ParticipationNotFoundException(Long id) {
        super(404, "参与记录不存在，ID: " + id);
    }
}
