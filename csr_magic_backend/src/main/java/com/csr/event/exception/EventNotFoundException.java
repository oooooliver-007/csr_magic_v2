package com.csr.event.exception;

import com.csr.common.BusinessException;

public class EventNotFoundException extends BusinessException {

    public EventNotFoundException(Long id) {
        super(404, "事件不存在，ID: " + id);
    }
}
