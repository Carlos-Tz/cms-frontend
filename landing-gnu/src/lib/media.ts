// Animated GIFs already move on their own, so the hero banners show them
// whole (no crop) and skip the Ken Burns zoom.
export const isGif = (url: string) => /\.gif($|[?#])/i.test(url);
