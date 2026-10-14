import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { db } from "./prisma";

// React cache is scoped to a server render, never shared between users.
export const checkUser = cache(async () => {
    const { userId } = await auth();
    if (!userId) return null;
    const existing = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (existing) return existing;
    const profile = await currentUser();
    if (!profile) return null;
    const data = {
        clerkUserId: userId,
        name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
        imageUrl: profile.imageUrl,
        email: profile.emailAddresses.find(email => email.id === profile.primaryEmailAddressId)?.emailAddress
            || profile.emailAddresses[0]?.emailAddress,
    };
    try {
        return await db.user.upsert({ where: { clerkUserId: userId }, update: {}, create: data });
    } catch (error) {
        if (error.code === "P2002") {
            const user = await db.user.findUnique({ where: { clerkUserId: userId } });
            if (user) return user;
        }
        throw error;
    }
});
