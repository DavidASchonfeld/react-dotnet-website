public interface IMediaTypeService
{
    Task<ServiceResult<List<MediaTypeSummaryDto>>> GetAllApprovedAsync();
    Task<ServiceResult<MediaTypeDetailDto>> GetMediaTypeAsync(int mediaTypeId, string requesterUserId);
}