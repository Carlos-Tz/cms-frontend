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
