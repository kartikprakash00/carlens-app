const scalar = value => typeof value === "string" ? value : "";
const price = (value, fallback) => {
    if (value === undefined || value === "" || Array.isArray(value)) return fallback;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
};
export function normalizeCarQuery(input = {}) {
    const page = Array.isArray(input.page) ? NaN : Number(input.page);
    const limit = Array.isArray(input.limit) ? NaN : Number(input.limit);
    const minPrice = price(input.minPrice, 0);
    return {
        ...Object.fromEntries(["search", "make", "bodyType", "fuelType", "transmission"].map(key => [key, scalar(input[key]).trim()])),
        minPrice,
        maxPrice: Math.max(minPrice, price(input.maxPrice, Number.MAX_SAFE_INTEGER)),
        sortBy: ["newest", "priceAsc", "priceDesc"].includes(input.sortBy) ? input.sortBy : "newest",
        page: Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1,
        limit: Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 100) : 6,
    };
}
