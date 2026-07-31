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
            partialize: (state) => ({
                accessToken: state.accessToken,
                tenantDomain: state.tenantDomain,
            }),
        }
    )
)
