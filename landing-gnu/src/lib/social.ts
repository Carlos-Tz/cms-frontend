// Shared with Layout.astro (footer + mobile nav) so the social icon set is
// defined once — SocialBand.astro (the "Nuestras redes sociales" section)
// reuses the exact same markup and fallback instead of a second copy of it.
import type { SocialIcons, SocialNetwork } from "../types/globals";

export const SOCIAL_ICON_MARKUP: Record<string, string> = {
  facebook:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.6C16.6 3.55 15.5 3.4 14.2 3.4c-2.7 0-4.5 1.65-4.5 4.65v2.85H7v3.1h2.7V21h3.8z"/></svg>',
  instagram:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  linkedin:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92zM20.44 20h-3.37v-6.05c0-1.44-.03-3.3-2.02-3.3-2.02 0-2.33 1.58-2.33 3.2V20H9.35V8.5h3.24v1.57h.05c.45-.86 1.56-1.77 3.21-1.77 3.43 0 4.06 2.26 4.06 5.19V20z"/></svg>',
  youtube:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2s-.2-1.5-.85-2.15c-.8-.85-1.7-.85-2.1-.9C15.8 4 12 4 12 4h0s-3.8 0-6.65.15c-.4.05-1.3.05-2.1.9C2.6 5.7 2.4 7.2 2.4 7.2S2.2 9 2.2 10.7v1.6c0 1.7.2 3.5.2 3.5s.2 1.5.85 2.15c.8.85 1.85.82 2.3.91C7.2 19 12 19 12 19s3.8 0 6.65-.15c.4-.05 1.3-.05 2.1-.9.65-.65.85-2.15.85-2.15s.2-1.8.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM10 14.6V8.9l5.2 2.85z"/></svg>',
  twitter:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 3H21l-6.4 7.3L22 21h-5.9l-4.6-6-5.3 6H3l6.8-7.8L2.4 3h6l4.2 5.5L18.9 3zM17.9 19.3h1.6L8.2 4.6H6.5l11.4 14.7z"/></svg>',
  tiktok:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3h2.7c.2 1.5 1 2.8 2.3 3.6.9.6 2 .9 3 .9v2.8c-1.5 0-3-.4-4.3-1.2v6.6c0 3.4-2.8 6.1-6.1 6.1S6 18.1 6 14.8c0-3.2 2.5-5.8 5.6-6.1v2.9c-1.5.3-2.7 1.6-2.7 3.2 0 1.8 1.4 3.2 3.2 3.2s3.2-1.4 3.2-3.2V3z"/></svg>',
};

const FALLBACK_NETWORKS: SocialNetwork[] = [
  { network: "facebook", url: "#" },
  { network: "instagram", url: "#" },
  { network: "linkedin", url: "#" },
  { network: "youtube", url: "#" },
];

// The same live-or-fallback resolution Layout.astro uses for the footer and
// mobile nav, filtered to networks we actually have an icon for.
export function resolveSocialNetworks(socialIcons?: SocialIcons | null): SocialNetwork[] {
  const networks = socialIcons?.networks?.length ? socialIcons.networks : FALLBACK_NETWORKS;
  return networks.filter((item) => SOCIAL_ICON_MARKUP[item.network]);
}

export const WHATSAPP_ICON_MARKUP =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.35A10 10 0 1 0 12 2zm0 18.1a8.06 8.06 0 0 1-4.1-1.12l-.3-.18-3 .8.8-2.93-.19-.3A8.1 8.1 0 1 1 12 20.1zm4.44-6.06c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34 1 2.5.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28z"/></svg>';
