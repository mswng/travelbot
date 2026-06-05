export const unwrapApi = (response) => response?.data?.data ?? response?.data ?? response;

export const unwrapPageContent = (payload) => payload?.content ?? payload ?? [];

export const getPageMeta = (payload) => ({
    page: payload?.page ?? 0,
    size: payload?.size ?? 10,
    totalElements: payload?.totalElements ?? unwrapPageContent(payload).length,
    totalPages: payload?.totalPages ?? 1,
    last: payload?.last ?? true,
});

export const buildQuery = (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    return query.toString();
};
