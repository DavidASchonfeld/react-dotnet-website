const MEDIA_TYPE_ICONS: Record<string, string> = {
    "Movie": "🎬",
    "TV Show": "📺",
    "Book": "📘",
    "Video Game": "🎮",
    "Song": "🎵",
    "Play (Theater)" : "🎭",
    "Podcast/Radio Show" : "🎙️",
    "Comic Book":"🖌️",
    "Webcomic":"🕸️",
    "Tabletop Games":"♟️🎲"
};

export function getMediaTypeIcon(name: string | undefined): string {
    if (!name) return "❓";
    return MEDIA_TYPE_ICONS[name] ?? "❓";
}
