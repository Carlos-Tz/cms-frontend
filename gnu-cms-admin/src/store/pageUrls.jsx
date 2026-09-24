import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const usePageUrlsStore = create(
  persist(
    (set) => ({
      pageUrls: {
        gnu: 'gnu-url.com',
        'gas-gnu': 'gas-gnu-url.com',
        trainin: 'trainin-url.com',
        tectuus: 'https://www.tectuus-url.com',
      },

      setPageUrls: (pageUrls) => set({ pageUrls }),

      setPageUrl: (site, url) => {
        set((state) => ({ pageUrls: { ...state.pageUrls, [site]: url } }));
      },

      removePageUrl: (site) => {
        set((state) => {
          const { [site]: _removed, ...rest } = state.pageUrls;
          return { pageUrls: rest };
        });
      },

      clearPageUrls: () => set({ pageUrls: {} }),
    }),
    {
      name: 'page-urls-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default usePageUrlsStore;
