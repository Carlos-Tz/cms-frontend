import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSessionStore = create(
    persist(
        () => ({
            accessToken: null,
            tenantDomain: import.meta.env.VITE_BASE_URL,
        }),
        {
            name: 'gnu-cms-session',
            // Only the token is persisted. `tenantDomain` comes from the build's
            // VITE_BASE_URL: persisting it would pin an already-open browser to
            // the API host of whichever build first wrote localStorage, so
            // pointing the panel at another environment would silently not take.
            partialize: (state) => ({
                accessToken: state.accessToken,
            }),
        }
    )
)
