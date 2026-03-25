// Centralized location for route paths that have variables in the route path

// To export to App.tsx which uses these hardcoded strings
export const routePaths = {
    mediaApiRef: '/mediaapiref/:id',
    mediaList:   '/medialist/:id',
    tag:         '/tags/:tagId',
    tagItems:    '/tags/:tagId/items',
} as const;

// To build those strings for other places
export const routes = {
    mediaApiRef: (id: number) => `/mediaapiref/${id}`,
    mediaList:   (id: number) => `/medialist/${id}`,
    tag:         (id: number) => `/tags/${id}`,
    tagItems:    (id: number) => `/tags/${id}/items`,
} as const;
