package com.csr.activity.exception;

import com.csr.common.BusinessException;

public class ActivityNotFoundException extends BusinessException {

    public ActivityNotFoundException(Long id) {
        super(404, "活动不存在，ID: " + id);
    }
}
