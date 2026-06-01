package com.csr.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 基于内存滑动窗口的频率限制拦截器。
 * 对标注 @RateLimit 的方法进行请求频率校验。
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    /**
     * key: "method:ip:windowStart", value: 当前窗口的请求计数
     */
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
        if (rateLimit == null) {
            return true;
        }

        String clientIp = getClientIp(request);
        String methodKey = handlerMethod.getMethod().getName();
        int maxRequests = rateLimit.maxRequests();
        int windowSeconds = rateLimit.windowSeconds();

        long now = System.currentTimeMillis();
        long windowStart = (now / 1000 / windowSeconds) * windowSeconds;
        String counterKey = methodKey + ":" + clientIp + ":" + windowStart;

        WindowCounter counter = counters.computeIfAbsent(counterKey, k -> new WindowCounter(windowStart));
        int count = counter.incrementAndGet();

        // 清理过期计数器（简单策略：超过 2 个窗口的旧 key）
        if (counters.size() > 10000) {
            long expireBefore = windowStart - windowSeconds * 2;
            counters.entrySet().removeIf(e -> e.getValue().windowStart < expireBefore);
        }

        if (count > maxRequests) {
            log.warn("频率限制触发: method={}, ip={}, count={}, max={}", methodKey, clientIp, count, maxRequests);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\",\"data\":null}"
            );
            return false;
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static class WindowCounter {
        final long windowStart;
        final AtomicInteger counter = new AtomicInteger(0);

        WindowCounter(long windowStart) {
            this.windowStart = windowStart;
        }

        int incrementAndGet() {
            return counter.incrementAndGet();
        }
    }
}
