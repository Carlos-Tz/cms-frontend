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
        const res = await response.json()
        console.log('On PUT sections response ', res)
        return res
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

        if (response.status === 204) {
            return { status: 'success' }
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting blog post:', error)
        return { status: 'error', meta: { message: 'No se pudo eliminar el artículo' } }
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

        return await response.json()
    } catch (error) {
        console.error('Error uploading media:', error)
        return { status: 'error', meta: { message: 'No se pudo subir el archivo' } }
    }
}

export async function fetchData(suffix) {

    const tenantDomain = useSessionStore.getState().tenantDomain
    const accessToken = useSessionStore.getState().accessToken
    const TOKEN = accessToken
    // console.log('request token', TOKEN)

    try {
        const response = await fetch(tenantDomain + suffix, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        })

        if (response.status === 401) {
            handleUnauthorized()
            return
        }
        const res = await response.json()
        console.log('Response for ', suffix, res)
        return res
    } catch (error) {
        alert('Error al obtener datos ', error)
        console.error('Error fetching data:', error)
    }
}