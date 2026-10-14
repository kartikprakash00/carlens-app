"use server";

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { normalizeCarQuery } from "@/lib/car-query";

const readCarFilters = unstable_cache(async () => {

    try {

        const [makes, bodyTypes, fuelTypes, transmissions, priceAggregations] = await Promise.all([
            db.car.findMany({
                where: { status: "AVAILABLE" },
                select: { make: true },
                distinct: ["make"],
                orderBy: { make: "asc" },
            }),
            db.car.findMany({
                where: { status: "AVAILABLE" },
                select: { bodyType: true },
                distinct: ["bodyType"],
                orderBy: { bodyType: "asc" },
            }),
            db.car.findMany({
                where: { status: "AVAILABLE" },
                select: { fuelType: true },
                distinct: ["fuelType"],
                orderBy: { fuelType: "asc" },
            }),
            db.car.findMany({
                where: { status: "AVAILABLE" },
                select: { transmission: true },
                distinct: ["transmission"],
                orderBy: { transmission: "asc" },
            }),
            db.car.aggregate({
                where: { status: "AVAILABLE" },
                _min: { price: true },
                _max: { price: true },
            })
        ]);

        return {
            success: true,
            data: {
                makes: makes.map((item) => item.make),
                bodyTypes: bodyTypes.map((item) => item.bodyType),
                fuelTypes: fuelTypes.map((item) => item.fuelType),
                transmissions: transmissions.map((item) => item.transmission),
                priceRange: {
                    min: priceAggregations._min.price ? parseFloat(priceAggregations._min.price.toString()) : 0,
                    max: priceAggregations._max.price ? parseFloat(priceAggregations._max.price.toString()) : 100000,
                },
            },
        };

    } catch (error) {
        throw new Error("Error fetching car filters: " + error.message);
    }
}, ["car-filters"], { revalidate: 60, tags: ["car-filters"] });

export const getCarFilters = async () => readCarFilters();

export const getCars = async (input = {}) => {
    const { search, make, bodyType, fuelType, transmission, minPrice, maxPrice, sortBy, page, limit } = normalizeCarQuery(input);
    try {
        const userPromise = checkUser();

        let where = {
            status: "AVAILABLE",
        };

        if (search) {
            where.OR = [
                { make: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        if (make)
            where.make = { equals: make, mode: "insensitive" };

        if (bodyType)
            where.bodyType = { equals: bodyType, mode: "insensitive" };

        if (fuelType)
            where.fuelType = { equals: fuelType, mode: "insensitive" };

        if (transmission)
            where.transmission = { equals: transmission, mode: "insensitive" };

        where.price = {
            gte: parseFloat(minPrice) || 0,
        };

        if (maxPrice < Number.MAX_SAFE_INTEGER) {
            where.price.lte = parseFloat(maxPrice);
        }

        const skip = (page - 1) * limit;

        let orderBy = {};
        switch (sortBy) {
            case "priceAsc":
                orderBy = { price: "asc" };
                break;
            case "priceDesc":
                orderBy = { price: "desc" };
                break;
            case "newest":
            default:
                orderBy = { createdAt: "desc" };
                break;
        }

        const [totalCars, cars, dbUser] = await Promise.all([
            db.car.count({ where }),
            db.car.findMany({ where, take: limit, skip, orderBy }),
            userPromise,
        ]);

        let wishlisted = new Set();
        if (dbUser) {
            const savedCars = await db.userSavedCar.findMany({
                where: { userId: dbUser.id, carId: { in: cars.map(car => car.id) } },
                select: { carId: true },
            });

            wishlisted = new Set(savedCars.map(saved => saved.carId));
        }

        const serializedCars = cars.map((car) => serializeCarData(car, wishlisted.has(car.id)));

        return {
            success: true,
            data: serializedCars,
            pagination: {
                total: totalCars,
                page,
                limit,
                pages: Math.ceil(totalCars / limit),
            },
        };

    } catch (error) {
        throw new Error("Error fetching cars: " + error.message);
    }
}

export const toggleSavedCar = async (carId) => {
    try {

        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await checkUser();

        if (!user) {
            throw new Error("User not found");
        }

        const car = await db.car.findUnique({
            where: { id: carId },
        });

        if (!car) {
            return {
                success: false,
                error: "Car not found",
            };
        }

        const existingSave = await db.userSavedCar.findUnique({
            where: {
                userId_carId: {
                    userId: user.id,
                    carId,
                },
            },
        });

        if (existingSave) {
            await db.userSavedCar.delete({
                where: {
                    userId_carId: {
                        userId: user.id,
                        carId,
                    },
                },
            });

            revalidatePath(`/saved-cars`);
            revalidatePath("/");
            revalidatePath("/cars");
            revalidatePath(`/cars/${carId}`);
            return {
                success: true,
                saved: false,
                message: "Car removed from favorites",
            };
        }

        await db.userSavedCar.create({
            data: {
                userId: user.id,
                carId,
            },
        });

        revalidatePath(`/saved-cars`);
        revalidatePath("/");
        revalidatePath("/cars");
        revalidatePath(`/cars/${carId}`);
        return {
            success: true,
            saved: true,
            message: "Car added to favorites",
        };

    } catch (error) {
        throw new Error("Error toggling saved car: " + error.message);
    }
}

export const getSavedCars = async () => {
    try {

        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await checkUser();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const savedCars = await db.userSavedCar.findMany({
            where: { userId: user.id },
            include: { car: true },
            orderBy: { savedAt: "desc" },
        });

        const cars = savedCars.map((saved) => serializeCarData(saved.car, true));

        return { success: true, data: cars };

    } catch (error) {
        console.error("Error fetching saved cars: ", error);
        return { success: false, error: error.message };
    }
}