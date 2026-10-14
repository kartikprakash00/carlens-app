import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },

    images: {
        remotePatterns: [...new Set([
            "opxstaeqvzakqaqdjvfq.supabase.co",
            ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname] : []),
        ])].map(hostname => ({ protocol: "https", hostname })),
    },

    async headers() {
        return [
            {
                source: "/embed",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-src 'self' https://vehiql-waitlist-ap.created.app"
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
