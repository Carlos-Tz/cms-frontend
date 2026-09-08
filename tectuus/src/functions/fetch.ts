export const BASE_URL = import.meta.env.CMS_API_URL || "http://localhost:3000/"
const MEDIA_ORIGIN = new URL(BASE_URL).origin

// Stands in for a CMS image that is missing, or whose path points at a file
// that was never uploaded (the seeded `media/placeholder-*` paths all 404).
// Lives in `public/` so it needs no import and passes through mediaUrl as-is.
export const FALLBACK_IMAGE = "/placeholder-plate.svg"

// CMS media paths are relative to the API host's /storage root. Absolute URLs
// and root-relative paths (Astro-bundled fallback images) pass through as-is.
export function mediaUrl(path: string) {
    if (!path) return path
    return /^(https?:\/\/|\/)/i.test(path) ? path : `${MEDIA_ORIGIN}/storage/${path}`
}

export async function fetchData(suffix: string) {
    try {
        const response = await fetch(BASE_URL + suffix)
        const res = await response.json()
        return res
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

export async function sendData(suffix: string, data: unknown) {
    try {
        const response = await fetch(BASE_URL + suffix, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        const res = await response.json()
        return res
    } catch (error) {
        console.error('Error sending data:', error)
    }
}

export async function updateData(suffix: string, data: unknown) {
    try {
        const response = await fetch(BASE_URL + suffix, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        const res = await response.json()
        return res
    } catch (error) {
        console.error('Error updating data:', error)
    }
}
