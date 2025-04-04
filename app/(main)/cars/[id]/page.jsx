import { getCarById } from '@/actions/carDetails';
import { notFound } from 'next/navigation';
import React from 'react'
import CarDetails from './_components/car-details';

export const generateMetadata = async ({ params }) => {

    try {


        const { id } = await params;
        const result = await getCarById(id);

        if (!result.success) {
            return {
                title: "Car Not Found | CarLens",
                description: "The requested car could not be found",
            };
        }

        const car = result.data;

        return {
            title: `${car.year} ${car.make} ${car.model} | CarLens`,
            description: car.description.substring(0, 160),
            openGraph: {
                images: car.images?.[0] ? [car.images[0]] : [],
            },
        };
    } catch (error) {
        console.error("Metadata error:", err);
        return {
            title: "Error Loading Car | CarLens",
            description: "Something went wrong while fetching the car details.",
        };
    }
}

const CarPage = async ({ params }) => {

    try {
        const { id } = await params;
        const result = await getCarById(id);

        if (!result.success) {
            notFound();
        }

        return (
            <div className='container mx-auto px-4 py-12'>
                <CarDetails car={result.data} testDriveInfo={result.data.testDriveInfo} />
            </div>
        )
    } catch (error) {
        console.error("Error loading car:", error);
        notFound();
    }
}

export default CarPage
