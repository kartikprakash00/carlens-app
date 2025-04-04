"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma"
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const serializeCarData = (car, isWishlisted = false) => {
    return {
        ...car,
        price: car.price ? parseFloat(car.price.toString()) : 0,
        createdAt: car.createdAt?.toISOString(),
        updatedAt: car.updatedAt?.toISOString(),
        wishlisted: isWishlisted,
    };
}

export const getFeaturedCars = async (limit = 3) => {
    try {

        const { userId } = await auth();
        let dbUser = null;
        let wishlisted = new Set();

        if (userId) {
            dbUser = await db.user.findUnique({
                where: { clerkUserId: userId },
            });

            if (dbUser) {
                const savedCars = await db.userSavedCar.findMany({
                    where: { userId: dbUser.id },
                    select: { carId: true },
                });

                wishlisted = new Set(savedCars.map(saved => saved.carId));
            }
        }

        const cars = await db.car.findMany({
            where: {
                featured: true,
                status: "AVAILABLE",
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return cars.map(car => serializeCarData(car, wishlisted.has(car.id)));

    } catch (error) {
        throw new Error("Error fetching featured cars" + error.message);
    }
}

async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
}

export const processImageSearch = async (file) => {
    try {

        // Rate limiting with arcjet
        const req = await request();

        const decision = await aj.protect(req, {
            requested: 1,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;

                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset,
                    },
                });

                throw new Error("Too many requests. Please try again later.");
            }
            throw new Error("Request blocked");
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const base64Image = await fileToBase64(file);

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: file.type,
            },
        };

        const prompt = `
            Analyze this car image and extract the following information for a search query:
                1. Make (manufacturer)
                2. Body type (SUV, Sedan, Hatchback, etc.)
                3. Color

            Format your response as a clean JSON object with these fields:
                {
                    "make": "",
                    "bodyType": "",
                    "color": "",
                    "confidence": 0.0
                }

            For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
            Only respond with the JSON object, nothing else.
        `;

        const result = await model.generateContent([imagePart, prompt]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try {

            const carDetails = JSON.parse(cleanedText);

            return {
                success: true,
                data: carDetails,
            };

        } catch (parseError) {
            console.error("Failed to parse AI response", parseError);
            return {
                success: false,
                error: "Failed to parse AI response",
            };
        }

    } catch (error) {
        throw new Error("AI search error" + error.message);
    }
}