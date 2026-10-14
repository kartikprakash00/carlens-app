import "server-only";
import { cache } from "react";

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

export const getCarById = cache(async (carId) => {
    try {

        const [dbUser, car, dealership] = await Promise.all([
            checkUser(),
            db.car.findUnique({ where: { id: carId } }),
            db.dealershipInfo.findFirst({ include: { workingHours: true } }),
        ]);
        if (!car) return { success: false, error: "Car not found" };
        const [savedCar, existingTestDrive] = dbUser ? await Promise.all([
            db.userSavedCar.findUnique({ where: { userId_carId: { userId: dbUser.id, carId } } }),
            db.testDriveBooking.findFirst({
                where: { carId, userId: dbUser.id, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
                orderBy: { createdAt: "desc" },
            }),
        ]) : [null, null];
        const isWishlisted = !!savedCar;
        const userTestDrive = existingTestDrive ? {
            id: existingTestDrive.id, status: existingTestDrive.status,
            bookingDate: existingTestDrive.bookingDate.toISOString(),
        } : null;

        return {
            success: true,
            data: {
                ...serializeCarData(car, isWishlisted),
                testDriveInfo: {
                    userTestDrive,
                    dealership: dealership ? {
                        ...dealership,
                        createdAt: dealership.createdAt.toISOString(),
                        updatedAt: dealership.updatedAt.toISOString(),
                        workingHours: dealership.workingHours.map((hour) => ({
                            ...hour,
                            createdAt: hour.createdAt.toISOString(),
                            updatedAt: hour.updatedAt.toISOString(),
                        })),
                    } : null,
                },
            },
        };

    } catch (error) {
        throw new Error("Error fetching car details: " + error.message);
    }
});
