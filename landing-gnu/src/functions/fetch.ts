export const BASE_URL = import.meta.env.CMS_API_URL || "http://localhost:3000/"
const MEDIA_ORIGIN = new URL(BASE_URL).origin

export function mediaUrl(path: string) {
    return /^https?:\/\//i.test(path) ? path : `${MEDIA_ORIGIN}/storage/${path}`
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
