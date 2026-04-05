using System.Text.Json;
using System.Text.Json.Serialization;

// Ensures all DateTime values deserialized from JSON request bodies have DateTimeKind.Utc.
// Required because PostgreSQL's "timestamp with time zone" column type rejects DateTimeKind.Unspecified,
// which is what System.Text.Json produces for ISO 8601 strings without a 'Z' or offset suffix.
// Registered globally in Program.cs so every endpoint benefits automatically.

public class UtcDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => DateTime.SpecifyKind(reader.GetDateTime(), DateTimeKind.Utc);

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToUniversalTime());
}

// Nullable variant — required for DateTime? properties in request DTOs
public class UtcNullableDateTimeJsonConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null ? null : DateTime.SpecifyKind(reader.GetDateTime(), DateTimeKind.Utc);

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteStringValue(value.Value.ToUniversalTime());
    }
}
