"use server";

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const getAdmin = async () => {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
        return { authorized: false, reason: "not-admin" };
    }

    return { authorized: true, user };
}

export const getAdminTestDrives = async ({ search = "", status = "" }) => {
    try {

        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error("Unauthorized access");
        }

        let where = {};
        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                {
                    car: {
                        OR: [
                            { make: { contains: search, mode: "insensitive" } },
                            { model: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
                {
                    user: {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
            ];
        }

        const bookings = await db.testDriveBooking.findMany({
            where,
            include: {
                car: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imageUrl: true,
                        phone: true,
                    },
                },
            },
            orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
        });

        const formattedBookings = bookings.map((booking) => ({
            id: booking.id,
            carId: booking.carId,
            car: serializeCarData(booking.car),
            userId: booking.userId,
            user: booking.user,
            bookingDate: booking.bookingDate.toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            notes: booking.notes,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
        }));

        return { success: true, data: formattedBookings };

    } catch (error) {
        console.error("Error fetching test drives", error);
        return { success: false, error: error.message };
    }
}

export const updateTestDriveStatus = async (bookingId, newStatus) => {
    try {

        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error("Unauthorized access");
        }

        const booking = await db.testDriveBooking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        const validStatuses = [
            "PENDING",
            "CONFIRMED",
            "COMPLETED",
            "CANCELLED",
            "NO_SHOW",
        ];

        if (!validStatuses.includes(newStatus)) {
            return { success: false, error: "Invalid status" };
        }

        await db.testDriveBooking.update({
            where: { id: bookingId },
            data: { status: newStatus },
        });

        revalidatePath("/admin/test-drives");
        revalidatePath("/reservations");

        return { success: true, message: "Test drive status updated successfully" };

    } catch (error) {
        throw new Error("Error updating test drive status:" + error.message);
    }
}

export const getDashboardData = async () => {
    try {

        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            return { authorized: false, error: "Unauthorized" };
        }

        // const totalCars = await db.car.count();
        // const availableCars = await db.car.count({ where: { status: "AVAILABLE" } });
        // const soldCars = await db.car.count({ where: { status: "SOLD" } });
        // const unavailableCars = await db.car.count({ where: { status: "UNAVAILABLE" } });
        // const featuredCars = await db.car.count({ where: { featured: true } });

        // const totalTestDrives = await db.testDriveBooking.count();
        // const pendingTestDrives = await db.testDriveBooking.count({ where: { status: "PENDING" } });
        // const confirmedTestDrives = await db.testDriveBooking.count({ where: { status: "CONFIRMED" } });
        // const completedTestDrives = await db.testDriveBooking.count({ where: { status: "COMPLETED" } });
        // const cancelledTestDrives = await db.testDriveBooking.count({ where: { status: "CANCELLED" } });
        // const noShowTestDrives = await db.testDriveBooking.count({ where: { status: "NO_SHOW" } });

        // const completedTestDriveCarIds = await db.testDriveBooking.findMany({
        //     where: { status: "COMPLETED" },
        //     select: { carId: true },
        // });

        // const soldCarsAfterTestDrive = await db.car.count({
        //     where: {
        //         id: { in: completedTestDriveCarIds.map(item => item.carId) },
        //         status: "SOLD",
        //     },
        // });

        // const conversionRate = completedTestDrives > 0 ? (soldCarsAfterTestDrive / completedTestDrives) * 100 : 0;

        const [cars, testDrives] = await Promise.all([
            db.car.findMany({
                select: {
                    id: true,
                    status: true,
                    featured: true,
                },
            }),
            db.testDriveBooking.findMany({
                select: {
                    id: true,
                    status: true,
                    carId: true,
                },
            })
        ]);

        const totalCars = cars.length;
        const availableCars = cars.filter((car) => car.status === "AVAILABLE").length;
        const soldCars = cars.filter((car) => car.status === "SOLD").length;
        const unavailableCars = cars.filter((car) => car.status === "UNAVAILABLE").length;
        const featuredCars = cars.filter((car) => car.featured === true).length;

        const totalTestDrives = testDrives.length;
        const pendingTestDrives = testDrives.filter((td) => td.status === "PENDING").length;
        const confirmedTestDrives = testDrives.filter((td) => td.status === "CONFIRMED").length;
        const completedTestDrives = testDrives.filter((td) => td.status === "COMPLETED").length;
        const cancelledTestDrives = testDrives.filter((td) => td.status === "CANCELLED").length;
        const noShowTestDrives = testDrives.filter((td) => td.status === "NO_SHOW").length;
        const completedTestDriveCarIds = testDrives.filter((td) => td.status === "COMPLETED").map((td) => td.carId);
        const soldCarsAfterTestDrive = cars.filter((car) => car.status === "SOLD" && completedTestDriveCarIds.includes(car.id)).length;

        const conversionRate = completedTestDrives > 0 ? (soldCarsAfterTestDrive / completedTestDrives) * 100 : 0;

        return {
            success: true,
            data: {
                cars: {
                    total: totalCars,
                    available: availableCars,
                    sold: soldCars,
                    unavailable: unavailableCars,
                    featured: featuredCars,
                },
                testDrives: {
                    total: totalTestDrives,
                    pending: pendingTestDrives,
                    confirmed: confirmedTestDrives,
                    completed: completedTestDrives,
                    cancelled: cancelledTestDrives,
                    noShow: noShowTestDrives,
                    conversionRate: parseFloat(conversionRate.toFixed(2)),
                },
            },
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error.message);
        return { success: false, error: error.message };
    }
}