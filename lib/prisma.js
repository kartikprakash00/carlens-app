import { PrismaClient } from "@prisma/client";

function createDatabaseClient() {
    return new PrismaClient().$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const started = performance.now();
                    try {
                        return await query(args);
                    } catch (error) {
                        // Never log SQL, connection URLs, query arguments, or user records.
                        console.error("Database operation failed", { service: "database", model, operation, code: error.code });
                        throw error;
                    } finally {
                        if (process.env.PERFORMANCE_LOGGING === "1") {
                            console.info("Database timing", { model, operation, durationMs: Math.round(performance.now() - started) });
                        }
                    }
                },
            },
        },
    });
}

export const db = globalThis.prisma || createDatabaseClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
