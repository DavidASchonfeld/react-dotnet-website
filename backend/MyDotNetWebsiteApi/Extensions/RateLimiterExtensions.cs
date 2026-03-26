using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

public static class RateLimiterExtensions
{
    public const string AuthPolicy = "auth";
    public const string ExternalApiSearchPolicy = "externalApiSearch";
    public const string PublicEndpointPolicy = "publicEndpoint";
    public const string AuthenticatedGeneralPolicy = "authenticatedGeneral";

    public static IServiceCollection AddAppRateLimiting(
        this IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection("RateLimitSettings");

        services.AddRateLimiter(options =>
        {
            // Auth: sliding window per IP — prevents brute force boundary burst attacks
            options.AddPolicy(AuthPolicy, context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = settings.GetValue<int>("Auth:PermitLimit"),
                    Window = TimeSpan.FromSeconds(settings.GetValue<int>("Auth:WindowSeconds")),
                    SegmentsPerWindow = 4,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // External API search: fixed window per user — protects paid API quotas (OMDB, RAWG)
            options.AddPolicy(ExternalApiSearchPolicy, context =>
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var key = !string.IsNullOrEmpty(userId)
                    ? $"user:{userId}"
                    : $"ip:{context.Connection.RemoteIpAddress}";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = settings.GetValue<int>("ExternalApiSearch:PermitLimit"),
                    Window = TimeSpan.FromSeconds(settings.GetValue<int>("ExternalApiSearch:WindowSeconds")),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // Public endpoints: fixed window per IP — covers image cache and featured lists
            options.AddPolicy(PublicEndpointPolicy, context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = settings.GetValue<int>("PublicEndpoint:PermitLimit"),
                    Window = TimeSpan.FromSeconds(settings.GetValue<int>("PublicEndpoint:WindowSeconds")),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // Authenticated general: fixed window per user — lenient backstop for all [Authorize] endpoints
            options.AddPolicy(AuthenticatedGeneralPolicy, context =>
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var key = !string.IsNullOrEmpty(userId)
                    ? $"user:{userId}"
                    : $"ip:{context.Connection.RemoteIpAddress}";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = settings.GetValue<int>("AuthenticatedGeneral:PermitLimit"),
                    Window = TimeSpan.FromSeconds(settings.GetValue<int>("AuthenticatedGeneral:WindowSeconds")),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // All rejected requests return 429 with a Retry-After header
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                context.HttpContext.Response.ContentType = "application/problem+json";
                await context.HttpContext.Response.WriteAsync(
                    """{"status":429,"title":"Too many requests. Please try again later."}""",
                    cancellationToken);
            };
        });

        return services;
    }
}
