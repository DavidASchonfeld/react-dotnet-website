### Notes on Certain Ways of Parameters Set in the Model Files

// Regular Variable set
public string SubmittedByUserId { get; set; }

// The ? means this value can be null
public string? SubmittedByUserId { get; set; }

// Setting the default to string.Empty (aka "")
public string SubmittedByUserId { get; set; } = string.Empty;

// Since there is no ?, this variable is not allowed to be set to null
// But we set it to null and add the ! at the end to suppress warnings
// We are assuming that this variable will be auto-filled by EF Core
// so we will never trigger an error trying to get this variabl
// before it gets auto-filled by EF Core
public string SubmittedByUserId { get; set; } = null!;