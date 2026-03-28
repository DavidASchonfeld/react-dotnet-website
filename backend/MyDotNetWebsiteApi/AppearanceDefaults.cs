// Single source of truth for the app's default appearance settings.
// Used on new user registration and by the public appearance-defaults endpoint
// so the frontend can apply them on first visit or when resetting to default.
public static class AppearanceDefaults
{
    public const string Theme    = "teal-dayNight";  // Teal family, day/night variant
    public const string Modifier = "glass";          // Glass style modifier
}
