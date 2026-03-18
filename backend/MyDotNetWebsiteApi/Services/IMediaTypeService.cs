public interface IMediaTypeService
{
    Task<List<MediaTypeSummaryDto>> GetAllApprovedAsync();
    Task<ServiceResult<MediaTypeDetailDto>> GetMediaTypeAsync(int mediaTypeId, string requesterUserId);
}