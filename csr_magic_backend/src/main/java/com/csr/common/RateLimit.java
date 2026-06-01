package com.csr.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 频率限制注解。
 * 用于标记需要限制请求频率的 Controller 方法。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /** 时间窗口内的最大请求次数 */
    int maxRequests() default 10;

    /** 时间窗口大小（秒） */
    int windowSeconds() default 60;
}
