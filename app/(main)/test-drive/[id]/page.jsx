import { getCarById } from '@/actions/carDetails';
import { notFound } from 'next/navigation';
import React from 'react'
import TestDriveForm from './_components/test-drive-form';

export const generateMetadata = async () => {
    return {
        title: `Book Test Drive | CarLens`,
        description: `Schedule a test drive in few seconds`,
    };
}

const TestDrivePage = async ({ params }) => {

    const { id } = await params;
    const result = await getCarById(id)

    if (!result.success) {
        notFound();
    }

    return (
        <div className='conatiner mx-auto px-4 py-12'>
            <h1 className='text-6xl mb-6 gradient-title'>Book a Test Drive</h1>

            <TestDriveForm car={result.data} testDriveInfo={result.data.testDriveInfo} />
        </div>
    )
}

export default TestDrivePage
