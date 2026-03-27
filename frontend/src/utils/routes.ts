// Centralized location for route paths that have variables in the route path

// To export to App.tsx which uses these hardcoded strings
export const routePaths = {
    mediaApiRef: '/mediaapiref/:apiName/:externalId',
    mediaList:   '/medialist/:id',
    tag:         '/tags/:tagId',
} as const;

// To build those strings for other places
export const routes = {
    mediaApiRef: (apiName: string, externalId: string) =>
        `/mediaapiref/${encodeURIComponent(apiName)}/${encodeURIComponent(externalId)}`,
    mediaList:   (id: number) => `/medialist/${id}`,
    tag:         (id: number) => `/tags/${id}`,
} as const;
