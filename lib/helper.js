import { resolveCarImageUrl } from "./car-image";

// Helper function to serialize car data

export const serializeCarData = (car, wishlisted = false) => {
    return {
        ...car,
        images: car.images?.map(image => resolveCarImageUrl(image)) || [],
        price: car.price ? parseFloat(car.price.toString()) : 0,
        createdAt: car.createdAt?.toISOString(),
        updatedAt: car.updatedAt?.toISOString(),
        wishlisted: wishlisted,
    };
}

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}