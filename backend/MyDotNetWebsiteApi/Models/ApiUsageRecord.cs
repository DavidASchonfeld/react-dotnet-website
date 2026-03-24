// Tracks the number of requests made to an external API within a single billing period.
// One row exists per API per period — the RequestCount is incremented each time a search is made.
// Old period rows are kept for historical reference; only the current period row is actively updated.
public class ApiUsageRecord
{
    public int Id { get; set; }
    public string ApiName { get; set; } = string.Empty;    // "OMDB", "RAWG", "TVMaze", "OpenLibrary"
    public string PeriodType { get; set; } = string.Empty; // "Daily" or "Monthly"
    public DateTime PeriodStart { get; set; }               // UTC start of the billing period
    public int RequestCount { get; set; }
}
