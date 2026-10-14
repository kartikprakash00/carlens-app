"use client";
export default function ErrorPage({ reset }) {
    return <div role="alert" className="container mx-auto px-4 py-28"><h2 className="text-xl font-semibold">Unable to load this page</h2><p>Please try again in a moment.</p><button className="mt-4 rounded border px-4 py-2" onClick={reset}>Try again</button></div>;
}
