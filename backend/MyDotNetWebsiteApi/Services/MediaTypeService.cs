using Microsoft.EntityFrameworkCore;

public class MediaTypeService : IMediaTypeService
{
    private readonly AppDbContext _context;

    // The constructor
    public MediaTypeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<List<MediaTypeSummaryDto>>> GetAllApprovedAsync()
    {
        var types = await _context.MediaTypes
            .Where(t => t.IsApproved)
            .Select(t => new MediaTypeSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                IsApproved = t.IsApproved
            })
            .ToListAsync();
        return ServiceResult<List<MediaTypeSummaryDto>>.Ok(types);
    }

    public async Task<ServiceResult<MediaTypeDetailDto>> GetMediaTypeAsync(int mediaTypeId, string requesterId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterId);
        if (requesterUser == null) return ServiceResult<MediaTypeDetailDto>.Unauthorized();

        var targetedMediaType = await _context.MediaTypes.FindAsync(mediaTypeId);
        if (targetedMediaType == null) return ServiceResult<MediaTypeDetailDto>.NotFound();

        if (!PermissionHelper.CanSeeMediaType(requesterUser, targetedMediaType))
            return ServiceResult<MediaTypeDetailDto>.Forbidden();

        return ServiceResult<MediaTypeDetailDto>.Ok(new MediaTypeDetailDto
        {
            Id = targetedMediaType.Id,
            Name = targetedMediaType.Name,
            Description = targetedMediaType.Description,
            SubmittedById = targetedMediaType.SubmittedById,
            DateSubmitted = targetedMediaType.DateSubmitted,
            IsApproved = targetedMediaType.IsApproved
        });


    }



}