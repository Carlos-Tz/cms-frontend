import { fetchData } from "./fetch"
import type { Globals, GlobalsResponse, WhatsappButton } from "../types/globals"

/** Site-wide sections (contact details, socials, WhatsApp) from `/globals`. */
export async function fetchGlobals(): Promise<Globals | undefined> {
    const response: GlobalsResponse | undefined = await fetchData("globals")
    return response?.data
}

/** wa.me link for the CMS's WhatsApp button, or null when no number is set. */
export function whatsappHref(button: WhatsappButton | null | undefined) {
    const digits = (button?.phone ?? "").replace(/\D/g, "")
    if (!digits) return null

    const message = button?.prefilled_message
    return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`
}
