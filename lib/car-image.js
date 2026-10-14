const legacyStorageHost = "opxstaeqvzakqaqdjvfq.supabase.co";

// Inventory still contains URLs from the previous project. The objects were
// copied to the configured project with the same bucket and object paths.
export function resolveCarImageUrl(value, storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!storageUrl || typeof value !== "string") return value;
    try {
        const source = new URL(value);
        const target = new URL(storageUrl);
        if (source.hostname !== legacyStorageHost ||
            !source.pathname.startsWith("/storage/v1/object/public/cars-images/") ||
            target.protocol !== "https:") return value;
        return new URL(source.pathname + source.search + source.hash, target.origin).toString();
    } catch {
        return value;
    }
}
