module.exports = ({ cache, config }) => {
    const RATE_LIMIT_WINDOW_SECONDS = 60; 
    const MAX_REQUESTS_PER_WINDOW = 100; 

    return async ({ request, response, next, terminate }) => {
        const clientIp = request.ip || request.connection.remoteAddress;
        const rateLimitKey = `rateLimit:${clientIp}`;

        try {
            const requestCount = (await cache.get(rateLimitKey)) || 0;

            if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
                response.setHeader("Retry-After", RATE_LIMIT_WINDOW_SECONDS);
                return terminate({
                    error: "Too many requests. Please try again later.",
                    code: 429,
                });
            }

            await cache.incr(rateLimitKey);

            if (requestCount === 0) {
                await cache.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
            }

            response.setHeader(
                "X-RateLimit-Remaining",
                MAX_REQUESTS_PER_WINDOW - requestCount - 1
            );

            next();
        } catch (error) {
            console.error("Rate Limiting Middleware Error:", error);
            next();
        }
    };
};
