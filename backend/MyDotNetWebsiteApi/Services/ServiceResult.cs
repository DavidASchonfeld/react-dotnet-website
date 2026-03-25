using System.Net;
using Microsoft.AspNetCore.Mvc;

public class ServiceResult<T>
// Note: "T" means it is a wildcard for any type
// You could call ServiceResult<MediaListSummaryDto>, ServiceResult<bool> etc. ANY object type


{
    public bool IsSuccess {get; init; }
    public T? Data {get; init; }
    public string? ErrorMessage {get; init; }
    public int StatusCode { get; init; }
    public CacheMetadataDto? CacheMetadata { get; init; }

    public static ServiceResult<T> Ok(T data) =>
        new() { IsSuccess = true, Data = data, StatusCode = 200};

    public static ServiceResult<T> OkFromCache(T data, DateTime cachedAt) =>
        new()
        {
            IsSuccess = true,
            Data = data,
            StatusCode = 200,
            CacheMetadata = new CacheMetadataDto
            {
                IsFromCache = true,

                // Saving the Cache's Time zone as UTC. (The frontend will convert it to the user's local time)
                // Note: Before this, I had issues because I had not specified a timezone.
                CachedAt = DateTime.SpecifyKind(cachedAt, DateTimeKind.Utc)
            }
        };

    // Each error method is written out separately for better readability at call sites
    
    public static ServiceResult<T> NotFound(string message = "Not found.") =>
        new() { IsSuccess = false, ErrorMessage = message, StatusCode = 404 };
    
    public static ServiceResult<T> Forbidden() =>
        new() { IsSuccess = false, StatusCode = 403 };
    
    public static ServiceResult<T> Unauthorized() =>
        new() { IsSuccess = false, StatusCode = 401};

    public static ServiceResult<T> Conflict(string message) =>
        new() { IsSuccess = false, ErrorMessage = message, StatusCode = 409 };
    
    public static ServiceResult<T> BadRequest(string message) =>
        new() { IsSuccess = false, ErrorMessage = message, StatusCode = 400 };

    public static ServiceResult<T> NotImplemented(string message) =>
        new() { IsSuccess = false, ErrorMessage = message, StatusCode = 501};

    public static ServiceResult<T> ServiceUnavailable(string message) =>
        new() { IsSuccess = false, ErrorMessage = message, StatusCode = 503 };


}


// This is called a ServiceResultExtension (not a ControllerExtenstion)
// since, when you call it, you do:
//  [thatServiceResultObject].ToActionResult(passedInController);
// so it looks like you are calling this method on the ServiceResult object
// (That is what the "this" parameter means in the front in the ToActionResult method's parameters)

// This is located outside of ServiceResult class for testability.
// ToActionResult needs Controller, which is NOT pure Service.
// and ServiceResult class needs to be pure Service (so pure C#) with no ASP.NET dependencies for testing
public static class ServiceResultExtensions
{
    public static IActionResult ToActionResult<T>(this ServiceResult<T> result, ControllerBase controller)
    {
        if (result.IsSuccess) return controller.Ok(result.Data);
        
        // controller.Problem is a C#/.NET built-in method to auto-full the title from HttpStatusCode
        return controller.Problem(detail: result.ErrorMessage, statusCode: result.StatusCode);
    }
}