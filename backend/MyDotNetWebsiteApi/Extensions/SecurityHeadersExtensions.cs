public static class SecurityHeadersExtensions
{
    public static WebApplication UseSecurityHeaders(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;

            // Prevents browsers from guessing the content type — stops attackers from tricking the browser into
            // executing a file as a different type (e.g. a .txt file that contains JS).
            headers["X-Content-Type-Options"] = "nosniff";

            // Blocks this site from being embedded in an <iframe> on another domain — prevents clickjacking attacks
            // where an attacker overlays a hidden iframe to trick users into clicking things.
            headers["X-Frame-Options"] = "DENY";

            // Controls how much referrer info is sent with outgoing requests — "strict-origin-when-cross-origin"
            // sends the origin (no path/query) on cross-origin requests, protecting URL-embedded tokens or IDs.
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Restricts what resources the browser is allowed to load from a response.
            // "default-src 'none'" means no scripts, images, stylesheets, etc. — ideal for a pure JSON API
            // since API responses should never load browser resources. Skipped for /scalar because Scalar's
            // documentation UI loads its own JS and CSS.
            bool isScalarPath = context.Request.Path.StartsWithSegments("/scalar");
            if (!isScalarPath)
            {
                headers["Content-Security-Policy"] = "default-src 'none'";
            }

            // Tells browsers to always use HTTPS for this domain for 1 year — prevents SSL stripping attacks
            // where a man-in-the-middle downgrades an HTTPS connection to HTTP. Only sent in production
            // because dev runs on HTTP and setting HSTS there would break the local dev environment.
            bool isDevelopment = app.Environment.IsDevelopment();
            if (!isDevelopment)
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            // Restricts which browser features this API response can enable — denies camera, microphone,
            // and geolocation since a pure JSON API has no reason to access any of them.
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

            await next();
        });

        return app;
    }
}
