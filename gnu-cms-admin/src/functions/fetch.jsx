import React from 'react'

import { useSessionStore } from '../store/sessionStore'

const BASE_URL = import.meta.env.VITE_BASE_URL

export async function login(email, password) {
    try {
        const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })

        const res = await response.json()

        if (res.status === 'success') {
            useSessionStore.setState({
                accessToken: res.data.access_token,
                tenantDomain: BASE_URL,
            })
        }

        return res
    } catch (error) {
        console.error('Error logging in:', error)
        return { status: 'error', meta: { message: 'No se pudo iniciar sesión' } }
    }
}

export async function logout() {
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${BASE_URL}/api/admin/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        })

        const res = await response.json()

        return res
    } catch (error) {
        console.error('Error logging out:', error)
        return { status: 'error', meta: { message: 'No se pudo cerrar sesión' } }
    } finally {
        useSessionStore.setState({ accessToken: null })
    }
}

export async function updateSection(id, content) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/sections/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ content }),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        const result = await response.json()
        console.log('Response on update section: ', result)
        console.log('For url: ', `${tenantDomain}/api/admin/sections/${id}`)
        return result
    } catch (error) {
        console.error('Error updating section:', error)
        return { status: 'error', meta: { message: 'No se pudo actualizar la sección' } }
    }
}

export async function createBlogPost(payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/blog-posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating blog post:', error)
        return { status: 'error', meta: { message: 'No se pudo crear el artículo' } }
    }
}

export async function updateBlogPost(id, payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/blog-posts/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating blog post:', error)
        return { status: 'error', meta: { message: 'No se pudo actualizar el artículo' } }
    }
}

export async function deleteBlogPost(id) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/blog-posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting blog post:', error)
        return { status: 'error', meta: { message: 'No se pudo eliminar el artículo' } }
    }
}

export async function createProductCategory(payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/product-categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating product category:', error)
        return { status: 'error', meta: { message: 'No se pudo crear la categoría' } }
    }
}

export async function updateProductCategory(id, payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/product-categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating product category:', error)
        return { status: 'error', meta: { message: 'No se pudo actualizar la categoría' } }
    }
}

export async function deleteProductCategory(id) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/product-categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting product category:', error)
        return { status: 'error', meta: { message: 'No se pudo eliminar la categoría' } }
    }
}

export async function createProduct(payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating product:', error)
        return { status: 'error', meta: { message: 'No se pudo crear el producto' } }
    }
}

export async function updateProduct(id, payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating product:', error)
        return { status: 'error', meta: { message: 'No se pudo actualizar el producto' } }
    }
}

export async function deleteProduct(id) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting product:', error)
        return { status: 'error', meta: { message: 'No se pudo eliminar el producto' } }
    }
}

export async function createStation(payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/stations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating station:', error)
        return { status: 'error', meta: { message: 'No se pudo crear la estación' } }
    }
}

export async function updateStation(id, payload) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/stations/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating station:', error)
        return { status: 'error', meta: { message: 'No se pudo actualizar la estación' } }
    }
}

export async function deleteStation(id) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/stations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting station:', error)
        return { status: 'error', meta: { message: 'No se pudo eliminar la estación' } }
    }
}

export async function deleteAppointment(id) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(`${tenantDomain}/api/admin/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting appointment:', error)
        return { status: 'error', meta: { message: 'No se pudo cancelar la cita' } }
    }
}

export async function uploadMedia(file) {
    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    const formData = new FormData()
    formData.append('file', file)

    try {
        const response = await fetch(`${tenantDomain}/api/admin/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
            body: formData,
        })

        // console.log('Response on upload: ', await response.json())

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        const result = await response.json()
        console.log(result)
        return result;
    } catch (error) {
        console.error('Error uploading media:', error)
        return { status: 'error', meta: { message: 'No se pudo subir el archivo' } }
    }
}

// A JWT expires (the API's default TTL is an hour) while the panel is still
// open, so every request can come back 401. Dropping the stale token and
// sending the user back to /login is the only way out — this module lives
// outside the router, so the redirect is a plain location change.
function handleUnauthorized() {
    useSessionStore.setState({ accessToken: null })

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
    }
}

export async function fetchData(suffix) {

    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken

    try {
        const response = await fetch(tenantDomain + suffix, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            }
        })

        if (response.status === 401) {
            handleUnauthorized()
            return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
        }

        // Every caller reads `res.status`/`res.data`, so a failure has to come
        // back in the same `{status, data, meta}` shape the API uses rather
        // than as `undefined`.
        return await response.json()
    } catch (error) {
        console.error('Error fetching data:', suffix, error)
        return { status: 'error', data: null, meta: { message: 'No se pudieron obtener los datos.' } }
    }
}

// Site rebuilds go to the build-server service (see /build-server), not the
// CMS: the Astro sites only read the CMS at build time, so saved edits stay
// invisible until the site is rebuilt. `site` is the admin route prefix
// (gnu, gas-natural, trainin, tectuus). Only the service's URL lives here —
// the actual CODE_PATH/PUBLIC_PATH filesystem paths stay server-side, in
// build-server's own .env, since this is a browser bundle.
const BUILD_SERVER_URL = import.meta.env.VITE_BUILD_SERVER_URL

async function buildRequest(site, method) {
    const accessToken = useSessionStore.getState().accessToken
    const label = `[build-server] ${method} /builds/${site}`

    if (!BUILD_SERVER_URL) {
        const message = 'El servicio de reconstrucción no está configurado (VITE_BUILD_SERVER_URL).'
        console.error(`${label}:`, message)
        return { status: 'error', data: null, meta: { message } }
    }

    // Split the network call from the JSON parse so each failure mode gets
    // its own message instead of being lumped into one generic catch:
    // "never got a response" (service down, wrong URL, CORS, DNS) and
    // "got a response that isn't the JSON envelope every caller expects"
    // (e.g. a reverse proxy/platform error page in front of build-server,
    // or the process crashing mid-response) are different problems to fix.
    let response
    try {
        response = await fetch(`${BUILD_SERVER_URL}/builds/${site}`, {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        })
    } catch (error) {
        console.error(`${label}: no se pudo contactar`, error)
        return { status: 'error', data: null, meta: { message: 'No se pudo contactar al servicio de reconstrucción.' } }
    }

    console.log(`${label} → HTTP ${response.status}`)

    if (response.status === 401) {
        handleUnauthorized()
        return { status: 'error', data: null, meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
    }

    let body
    try {
        body = await response.json()
    } catch (error) {
        console.error(`${label}: HTTP ${response.status} no trajo JSON válido`, error)
        return {
            status: 'error',
            data: null,
            meta: { message: `El servicio de reconstrucción respondió con un error inesperado (HTTP ${response.status}).` },
        }
    }

    if (response.ok) {
        console.log(`${label}:`, body)
    } else {
        // Still a structured {status, data, meta} error from build-server itself
        // (401 already handled above; this covers 404/405/409/etc.) — log it at
        // error level so it's not missed among routine success logs.
        console.error(`${label}: HTTP ${response.status}`, body)
    }

    return body
}

export function rebuildSite(site) {
    return buildRequest(site, 'POST')
}

export function getRebuildStatus(site) {
    return buildRequest(site, 'GET')
}
