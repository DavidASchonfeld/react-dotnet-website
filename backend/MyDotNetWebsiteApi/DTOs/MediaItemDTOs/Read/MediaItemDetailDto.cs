public class MediaItemDetailDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}

    public bool CanEdit {get; set;}

    

    public string? Description {get; set; }
    // The ? means it can be Null (aka empty) if needed

    public bool IsApproved {get; set;}
    public DateTime? PublishedDateTime {get; set; }
    public string? SubmittedById {get; set;}
    
    public DateTime DateSubmitted {get; set; } = DateTime.UtcNow;




}