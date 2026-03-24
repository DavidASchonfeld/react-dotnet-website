const MEDIA_TYPE_ICONS: Record<string, string> = {
    "Movie": "🎬",
    "TV Show": "📺",
    "Book": "📘",
    "Video Game": "🎮",
};

export function getMediaTypeIcon(name: string | undefined): string {
    if (!name) return "❓";
    return MEDIA_TYPE_ICONS[name] ?? "❓";
}
