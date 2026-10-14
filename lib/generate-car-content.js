import "server-only";
export async function generateCarContent(model, parts) {
    const started = performance.now();
    try {
        return await model.generateContent(parts, { timeout: 30000 });
    } catch (error) {
        console.error("External service request failed", {
            service: "gemini", durationMs: Math.round(performance.now() - started),
            status: Number.isInteger(error.status) ? error.status : undefined,
            timedOut: error.name === "AbortError" || error.name === "GoogleGenerativeAIAbortError",
        });
        throw new Error("Car image analysis is temporarily unavailable or timed out. Please retry, or use text search.");
    }
}
